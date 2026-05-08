import { ForbiddenException } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FirebaseService } from '../firebase/firebase.service';
import { UserRole } from '../users/user.model';
import type { User } from '../users/user.model';
import { CreateTaskInput, UpdateTaskInput } from './task.input';
import { Task, TaskRecurrence, TaskStatus } from './task.model';
import { TasksService } from './tasks.service';

@Resolver(() => Task)
export class TasksResolver {
  constructor(
    private readonly tasks: TasksService,
    private readonly firebase: FirebaseService,
  ) {}

  @Query(() => [Task], { name: 'tasks' })
  async findAll(@CurrentUser() user: User): Promise<Task[]> {
    if (!user.familyId) throw new ForbiddenException('No family');
    const all = await this.tasks.findAll(user.familyId);

    if (user.role !== UserRole.CHILD) return all;

    // Child view: filter by assignment + recurrence (hide tasks already done within window)
    const targeted = all.filter(
      (t) => !t.assignedToChildUid || t.assignedToChildUid === user.uid,
    );

    const subsSnap = await this.firebase.firestore
      .collection('submissions')
      .where('familyId', '==', user.familyId)
      .where('childUid', '==', user.uid)
      .where('status', '==', 'approved')
      .get();

    const lastApprovedAt = new Map<string, number>();
    for (const d of subsSnap.docs) {
      const data = d.data() as { taskId?: string; reviewedAt?: string };
      if (!data.taskId) continue;
      const ts = data.reviewedAt
        ? new Date(data.reviewedAt).getTime()
        : 0;
      const prev = lastApprovedAt.get(data.taskId) ?? 0;
      if (ts > prev) lastApprovedAt.set(data.taskId, ts);
    }

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    return targeted.filter((t) => {
      const last = lastApprovedAt.get(t.id);
      if (!last) return true; // never completed → always available
      const recurrence = t.recurrence ?? TaskRecurrence.NONE;
      if (recurrence === TaskRecurrence.NONE) return false; // one-shot, already done
      if (recurrence === TaskRecurrence.DAILY) {
        return now - last >= dayMs;
      }
      if (recurrence === TaskRecurrence.WEEKLY) {
        return now - last >= 7 * dayMs;
      }
      return true;
    });
  }

  @Query(() => Task, { name: 'task' })
  async findOne(
    @CurrentUser() user: User,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Task> {
    const task = await this.tasks.findOne(id);
    if (task.familyId && task.familyId !== user.familyId) {
      throw new ForbiddenException('Not in your family');
    }
    return task;
  }

  @Mutation(() => Task)
  createTask(
    @CurrentUser() user: User,
    @Args('input') input: CreateTaskInput,
  ): Promise<Task> {
    return this.tasks.create({ ...input, familyId: user.familyId ?? user.uid });
  }

  @Mutation(() => Task)
  setTaskStatus(
    @CurrentUser() _user: User,
    @Args('id', { type: () => ID }) id: string,
    @Args('status', { type: () => TaskStatus }) status: TaskStatus,
  ): Promise<Task> {
    return this.tasks.setStatus(id, status);
  }

  @Mutation(() => Task)
  async updateTask(
    @CurrentUser() user: User,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateTaskInput,
  ): Promise<Task> {
    const existing = await this.tasks.findOne(id);
    if (existing.familyId && existing.familyId !== user.familyId) {
      throw new ForbiddenException('Not in your family');
    }
    return this.tasks.update(id, input);
  }

  @Mutation(() => Boolean)
  async deleteTask(
    @CurrentUser() user: User,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    const existing = await this.tasks.findOne(id);
    if (existing.familyId && existing.familyId !== user.familyId) {
      throw new ForbiddenException('Not in your family');
    }
    return this.tasks.remove(id);
  }
}
