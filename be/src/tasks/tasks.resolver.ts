import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { User } from '../users/user.model';
import { CreateTaskInput } from './task.input';
import { Task, TaskStatus } from './task.model';
import { TasksService } from './tasks.service';

@Resolver(() => Task)
export class TasksResolver {
  constructor(private readonly tasks: TasksService) {}

  @Public()
  @Query(() => [Task], { name: 'tasks' })
  findAll(
    @Args('familyId', { nullable: true }) familyId?: string,
  ): Promise<Task[]> {
    return this.tasks.findAll(familyId);
  }

  @Public()
  @Query(() => Task, { name: 'task' })
  findOne(@Args('id', { type: () => ID }) id: string): Promise<Task> {
    return this.tasks.findOne(id);
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

  @Mutation(() => Boolean)
  deleteTask(
    @CurrentUser() _user: User,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.tasks.remove(id);
  }
}
