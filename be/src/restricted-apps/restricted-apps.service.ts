import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { AddRestrictedAppInput } from './restricted-app.input';
import { RestrictedApp } from './restricted-app.model';

const COLLECTION = 'restrictedApps';

const DEFAULT_APPS: { appId: string; name: string }[] = [
  { appId: 'tiktok', name: 'TikTok' },
  { appId: 'instagram', name: 'Instagram' },
  { appId: 'youtube', name: 'YouTube' },
  { appId: 'roblox', name: 'Roblox' },
  { appId: 'snap', name: 'Snapchat' },
];

@Injectable()
export class RestrictedAppsService {
  constructor(private readonly firebase: FirebaseService) {}

  private get col() {
    return this.firebase.firestore.collection(COLLECTION);
  }

  private mapDoc(doc: FirebaseFirestore.DocumentSnapshot): RestrictedApp {
    return { id: doc.id, ...doc.data() } as RestrictedApp;
  }

  async listForFamily(familyId: string): Promise<RestrictedApp[]> {
    const snap = await this.col.where('familyId', '==', familyId).get();
    if (snap.empty) {
      return this.seedDefaults(familyId);
    }
    return snap.docs
      .map((d) => this.mapDoc(d))
      .sort((a, b) => a.appId.localeCompare(b.appId));
  }

  async seedDefaults(familyId: string): Promise<RestrictedApp[]> {
    const batch = this.firebase.firestore.batch();
    const docs: RestrictedApp[] = [];
    const now = new Date().toISOString();
    for (const app of DEFAULT_APPS) {
      const ref = this.col.doc();
      const data = { ...app, familyId, createdAt: now };
      batch.set(ref, data);
      docs.push({ id: ref.id, ...data });
    }
    await batch.commit();
    return docs;
  }

  async add(
    familyId: string,
    input: AddRestrictedAppInput,
  ): Promise<RestrictedApp> {
    const data = {
      familyId,
      appId: input.appId,
      name: input.name,
      packageName: input.packageName,
      createdAt: new Date().toISOString(),
    };
    const ref = await this.col.add(data);
    return { id: ref.id, ...data } as RestrictedApp;
  }

  async remove(id: string, familyId: string): Promise<boolean> {
    const doc = await this.col.doc(id).get();
    if (!doc.exists) throw new NotFoundException('Not found');
    const data = doc.data()!;
    if (data.familyId !== familyId) {
      throw new NotFoundException('Not in your family');
    }
    await this.col.doc(id).delete();
    return true;
  }
}
