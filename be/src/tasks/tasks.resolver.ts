import { ForbiddenException } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '../users/user.model';
import { CreateTaskInput, UpdateTaskInput } from './task.input';
import { Task, TaskStatus } from './task.model';
import { TasksService } from './tasks.service';

@Resolver(() => Task)
export class TasksResolver {
  constructor(private readonly tasks: TasksService) {}

  @Query(() => [Task], { name: 'tasks' })
  findAll(@CurrentUser() user: User): Promise<Task[]> {
    if (!user.familyId) throw new ForbiddenException('No family');
    return this.tasks.findAll(user.familyId);
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
