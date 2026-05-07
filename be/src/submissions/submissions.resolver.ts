import { ForbiddenException } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '../users/user.model';
import { UserRole } from '../users/user.model';
import {
  RejectSubmissionInput,
  RequestPhotoUploadInput,
  SubmitPhotoTaskInput,
  SubmitQuizTaskInput,
  SubmitTimerTaskInput,
} from './submission.input';
import {
  PhotoUploadTarget,
  Submission,
  SubmissionStatus,
} from './submission.model';
import { SubmissionsService } from './submissions.service';

@Resolver(() => Submission)
export class SubmissionsResolver {
  constructor(private readonly submissions: SubmissionsService) {}

  // --- Child mutations ---

  @Mutation(() => PhotoUploadTarget, {
    description: 'Child requests pre-signed PUT URL to upload photo',
  })
  requestPhotoUpload(
    @CurrentUser() user: User,
    @Args('input') input: RequestPhotoUploadInput,
  ): Promise<PhotoUploadTarget> {
    if (user.role !== UserRole.CHILD) {
      throw new ForbiddenException('Only children can request photo uploads');
    }
    if (!user.familyId) throw new ForbiddenException('No family');
    return this.submissions.requestPhotoUpload(user.uid, user.familyId, input.taskId);
  }

  @Mutation(() => Submission)
  submitPhotoTask(
    @CurrentUser() user: User,
    @Args('input') input: SubmitPhotoTaskInput,
  ): Promise<Submission> {
    if (user.role !== UserRole.CHILD) {
      throw new ForbiddenException('Only children submit tasks');
    }
    if (!user.familyId) throw new ForbiddenException('No family');
    return this.submissions.submitPhoto(user.uid, user.familyId, input);
  }

  @Mutation(() => Submission)
  submitTimerTask(
    @CurrentUser() user: User,
    @Args('input') input: SubmitTimerTaskInput,
  ): Promise<Submission> {
    if (user.role !== UserRole.CHILD) {
      throw new ForbiddenException('Only children submit tasks');
    }
    if (!user.familyId) throw new ForbiddenException('No family');
    return this.submissions.submitTimer(user.uid, user.familyId, input);
  }

  @Mutation(() => Submission, {
    description: 'Quiz auto-approves on score ≥ 80, else auto-rejects',
  })
  submitQuizTask(
    @CurrentUser() user: User,
    @Args('input') input: SubmitQuizTaskInput,
  ): Promise<Submission> {
    if (user.role !== UserRole.CHILD) {
      throw new ForbiddenException('Only children submit tasks');
    }
    if (!user.familyId) throw new ForbiddenException('No family');
    return this.submissions.submitQuiz(user.uid, user.familyId, input);
  }

  // --- Parent mutations ---

  @Mutation(() => Submission)
  async approveSubmission(
    @CurrentUser() user: User,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Submission> {
    if (user.role !== UserRole.PARENT) {
      throw new ForbiddenException('Only parents can approve');
    }
    const submission = await this.submissions.findOne(id);
    if (submission.familyId !== user.familyId) {
      throw new ForbiddenException('Not in your family');
    }
    return this.submissions.approve(id, user.uid);
  }

  @Mutation(() => Submission)
  async rejectSubmission(
    @CurrentUser() user: User,
    @Args('input') input: RejectSubmissionInput,
  ): Promise<Submission> {
    if (user.role !== UserRole.PARENT) {
      throw new ForbiddenException('Only parents can reject');
    }
    const submission = await this.submissions.findOne(input.id);
    if (submission.familyId !== user.familyId) {
      throw new ForbiddenException('Not in your family');
    }
    return this.submissions.reject(input.id, user.uid, input.reason);
  }

  // --- Queries ---

  @Query(() => [Submission], { name: 'pendingSubmissions' })
  async pendingSubmissions(@CurrentUser() user: User): Promise<Submission[]> {
    if (user.role !== UserRole.PARENT) {
      throw new ForbiddenException('Only parents see pending submissions');
    }
    if (!user.familyId) throw new ForbiddenException('No family');
    return this.submissions.listForFamily(user.familyId, SubmissionStatus.PENDING);
  }

  @Query(() => [Submission], { name: 'familySubmissions' })
  async familySubmissions(
    @CurrentUser() user: User,
    @Args('status', { type: () => SubmissionStatus, nullable: true })
    status?: SubmissionStatus,
  ): Promise<Submission[]> {
    if (!user.familyId) throw new ForbiddenException('No family');
    return this.submissions.listForFamily(user.familyId, status);
  }

  @Query(() => [Submission], { name: 'mySubmissions' })
  mySubmissions(@CurrentUser() user: User): Promise<Submission[]> {
    return this.submissions.listForChild(user.uid);
  }

  @Query(() => Submission, { name: 'submission' })
  async submission(
    @CurrentUser() user: User,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Submission> {
    const sub = await this.submissions.findOne(id);
    const allowed =
      sub.childUid === user.uid ||
      (user.role === UserRole.PARENT && sub.familyId === user.familyId);
    if (!allowed) throw new ForbiddenException('Cannot view this submission');
    return sub;
  }
}
