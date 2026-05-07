import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { User, UserRole } from './user.model';

const COLLECTION = 'users';

interface EnsureProfileInput {
  uid: string;
  email?: string;
  name?: string;
  role: UserRole;
  familyId?: string;
  parentUid?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly firebase: FirebaseService) {}

  private get col() {
    return this.firebase.firestore.collection(COLLECTION);
  }

  async findByUid(uid: string): Promise<User | null> {
    const doc = await this.col.doc(uid).get();
    if (!doc.exists) return null;
    return { uid: doc.id, ...doc.data() } as User;
  }

  async ensureProfile(input: EnsureProfileInput): Promise<User> {
    const ref = this.col.doc(input.uid);
    const existing = await ref.get();

    if (existing.exists) {
      const data = existing.data() as Omit<User, 'uid'>;
      const updates: Record<string, string> = {};
      if (input.email && input.email !== data.email) updates.email = input.email;
      if (input.name && input.name !== data.name) updates.name = input.name;
      if (Object.keys(updates).length > 0) await ref.update(updates);
      return { uid: ref.id, ...data, ...updates } as User;
    }

    const profile = {
      email: input.email ?? null,
      name: input.name ?? null,
      role: input.role,
      familyId: input.familyId ?? null,
      parentUid: input.parentUid ?? null,
      createdAt: new Date().toISOString(),
    };
    await ref.set(profile);
    return {
      uid: input.uid,
      email: profile.email ?? undefined,
      name: profile.name ?? undefined,
      role: profile.role,
      familyId: profile.familyId ?? undefined,
      parentUid: profile.parentUid ?? undefined,
      createdAt: profile.createdAt,
    };
  }

  async setFamilyId(uid: string, familyId: string): Promise<void> {
    await this.col.doc(uid).update({ familyId });
  }

  async setPushToken(uid: string, token: string | null): Promise<void> {
    await this.col.doc(uid).update({ pushToken: token });
  }

  async update(
    uid: string,
    patch: Record<string, unknown>,
  ): Promise<User> {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v !== undefined) cleaned[k] = v;
    }
    if (Object.keys(cleaned).length > 0) {
      await this.col.doc(uid).update(cleaned);
    }
    const found = await this.findByUid(uid);
    if (!found) throw new Error('User not found after update');
    return found;
  }
}
