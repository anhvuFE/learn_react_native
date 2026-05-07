import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FamiliesService } from '../families/families.service';
import { FirebaseService } from '../firebase/firebase.service';
import { UserRole } from '../users/user.model';
import { UsersService } from '../users/users.service';
import { PairChildDeviceInput } from './pairing.input';
import { PairingCode, PairingResult } from './pairing.model';

const COLLECTION = 'pairingCodes';
const CODE_TTL_MS = 24 * 60 * 60 * 1000;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit O/0/I/1
const CODE_LEN = 6;

interface PairingCodeDoc {
  code: string;
  parentUid: string;
  familyId: string;
  childName: string;
  used: boolean;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
  childUid?: string;
}

@Injectable()
export class PairingService {
  private readonly logger = new Logger(PairingService.name);

  constructor(
    private readonly firebase: FirebaseService,
    private readonly users: UsersService,
    private readonly families: FamiliesService,
  ) {}

  private get col() {
    return this.firebase.firestore.collection(COLLECTION);
  }

  private generateCode(): string {
    let s = '';
    for (let i = 0; i < CODE_LEN; i++) {
      s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return s;
  }

  async listActiveForParent(parentUid: string): Promise<PairingCode[]> {
    const snap = await this.col.where('parentUid', '==', parentUid).get();
    const now = Date.now();
    return snap.docs
      .map((d) => d.data() as PairingCodeDoc)
      .filter((d) => !d.used && new Date(d.expiresAt).getTime() > now)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((d) => ({
        code: d.code,
        expiresAt: d.expiresAt,
        childName: d.childName,
      }));
  }

  async createCode(
    parentUid: string,
    familyId: string,
    childName: string,
  ): Promise<PairingCode> {
    let code = '';
    for (let attempts = 0; attempts < 5; attempts++) {
      const candidate = this.generateCode();
      const existing = await this.col.doc(candidate).get();
      if (!existing.exists) {
        code = candidate;
        break;
      }
    }
    if (!code) throw new Error('Could not generate unique pairing code');

    const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
    const doc: PairingCodeDoc = {
      code,
      parentUid,
      familyId,
      childName,
      used: false,
      expiresAt,
      createdAt: new Date().toISOString(),
    };
    await this.col.doc(code).set(doc);
    this.logger.log(`Generated pairing code ${code} for child "${childName}"`);
    return { code, expiresAt, childName };
  }

  async consumeCode(
    rawCode: string,
    _device?: PairChildDeviceInput,
  ): Promise<PairingResult> {
    const code = rawCode.trim().toUpperCase();
    const ref = this.col.doc(code);
    const docSnap = await ref.get();
    if (!docSnap.exists) {
      throw new NotFoundException('Pairing code not found');
    }
    const data = docSnap.data() as PairingCodeDoc;
    if (data.used) {
      throw new BadRequestException('Pairing code already used');
    }
    if (new Date(data.expiresAt).getTime() < Date.now()) {
      throw new BadRequestException('Pairing code expired');
    }

    const childAuth = await this.firebase.auth.createUser({
      displayName: data.childName,
    });

    const child = await this.users.ensureProfile({
      uid: childAuth.uid,
      name: data.childName,
      role: UserRole.CHILD,
      familyId: data.familyId,
      parentUid: data.parentUid,
    });

    await this.families.addChild(data.familyId, childAuth.uid);

    await ref.update({
      used: true,
      usedAt: new Date().toISOString(),
      childUid: childAuth.uid,
    });

    const customToken = await this.firebase.auth.createCustomToken(
      childAuth.uid,
      {
        role: 'child',
        familyId: data.familyId,
        parentUid: data.parentUid,
      },
    );

    this.logger.log(
      `Paired child ${childAuth.uid} (${data.childName}) to family ${data.familyId} via code ${code}`,
    );

    return { customToken, child };
  }
}
