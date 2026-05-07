import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateTaskInput, UpdateTaskInput } from './task.input';
import { Task, TaskStatus } from './task.model';

const COLLECTION = 'tasks';

@Injectable()
export class TasksService {
  constructor(private readonly firebase: FirebaseService) {}

  private get col() {
    return this.firebase.firestore.collection(COLLECTION);
  }

  async findAll(familyId?: string): Promise<Task[]> {
    let query: FirebaseFirestore.Query = this.col;
    if (familyId) query = query.where('familyId', '==', familyId);
    const snap = await query.get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task);
  }

  async findOne(id: string): Promise<Task> {
    const doc = await this.col.doc(id).get();
    if (!doc.exists) throw new NotFoundException(`Task ${id} not found`);
    return { id: doc.id, ...doc.data() } as Task;
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const doc = await this.col.add({
      ...input,
      status: TaskStatus.AVAILABLE,
      createdAt: new Date().toISOString(),
    });
    const created = await doc.get();
    return { id: created.id, ...created.data() } as Task;
  }

  async setStatus(id: string, status: TaskStatus): Promise<Task> {
    await this.col.doc(id).update({ status });
    return this.findOne(id);
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) {
      if (v !== undefined) cleaned[k] = v;
    }
    if (Object.keys(cleaned).length > 0) {
      await this.col.doc(id).update(cleaned);
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<boolean> {
    await this.col.doc(id).delete();
    return true;
  }
}
