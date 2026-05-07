import { Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase/firebase.service';
import { Family } from './family.model';

const COLLECTION = 'families';

@Injectable()
export class FamiliesService {
  constructor(private readonly firebase: FirebaseService) {}

  private get col() {
    return this.firebase.firestore.collection(COLLECTION);
  }

  async findById(id: string): Promise<Family> {
    const doc = await this.col.doc(id).get();
    if (!doc.exists) throw new NotFoundException(`Family ${id} not found`);
    return { id: doc.id, ...doc.data() } as Family;
  }

  async findByParent(parentUid: string): Promise<Family | null> {
    const snap = await this.col
      .where('parentUid', '==', parentUid)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as Family;
  }

  async getOrCreateForParent(parentUid: string): Promise<Family> {
    const existing = await this.findByParent(parentUid);
    if (existing) return existing;
    const data = {
      parentUid,
      childUids: [],
      createdAt: new Date().toISOString(),
    };
    const ref = await this.col.add(data);
    return { id: ref.id, ...data };
  }

  async addChild(familyId: string, childUid: string): Promise<void> {
    await this.col.doc(familyId).update({
      childUids: admin.firestore.FieldValue.arrayUnion(childUid),
    });
  }
}
