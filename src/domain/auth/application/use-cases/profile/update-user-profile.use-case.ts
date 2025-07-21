// src/domain/auth/application/use-cases/profile/update-user-profile.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { IUserProfileRepository } from '../../repositories/i-user-profile-repository';
import { Either, left, right } from '@/core/either';
import {
  ResourceNotFoundError,
  InvalidInputError,
} from '@/domain/auth/domain/exceptions';
import {
  IEventDispatcher,
  EVENT_DISPATCHER,
} from '@/core/domain/events/i-event-dispatcher';
import { UserProfileUpdatedEvent } from '@/domain/auth/enterprise/events/user-profile-updated.event';

export interface UpdateUserProfileRequest {
  profileId: string;
  fullName?: string;
  phone?: string | null;
  birthDate?: Date | null;
  profileImageUrl?: string | null;
  bio?: string | null;
  profession?: string | null;
  specialization?: string | null;
  preferredLanguage?: string;
  timezone?: string;
}

export interface UpdateUserProfileResponse {
  profileId: string;
  fullName: string;
  phone?: string | null;
  birthDate?: Date | null;
  profileImageUrl?: string | null;
  bio?: string | null;
  profession?: string | null;
  specialization?: string | null;
  preferredLanguage: string;
  timezone: string;
  updatedAt: Date;
}

export type UpdateUserProfileResult = Either<
  ResourceNotFoundError | InvalidInputError,
  UpdateUserProfileResponse
>;

@Injectable()
export class UpdateUserProfileUseCase {
  constructor(
    @Inject(IUserProfileRepository)
    private profileRepo: IUserProfileRepository,
    @Inject(EVENT_DISPATCHER)
    private eventDispatcher: IEventDispatcher,
  ) {}

  async execute(
    req: UpdateUserProfileRequest,
  ): Promise<UpdateUserProfileResult> {
    // Find the profile
    const profileResult = await this.profileRepo.findById(req.profileId);

    if (profileResult.isLeft()) {
      return left(ResourceNotFoundError.withId('Profile', req.profileId));
    }

    const profile = profileResult.value;
    if (!profile) {
      return left(ResourceNotFoundError.withId('Profile', req.profileId));
    }

    // Validate inputs
    if (req.fullName !== undefined && req.fullName.trim().length === 0) {
      return left(new InvalidInputError('Full name cannot be empty'));
    }

    if (
      req.preferredLanguage !== undefined &&
      !['pt-BR', 'it', 'es', 'en'].includes(req.preferredLanguage)
    ) {
      return left(new InvalidInputError('Invalid preferred language'));
    }

    // Store old values for event
    const oldValues = {
      fullName: profile.fullName,
      phone: profile.phone,
      birthDate: profile.birthDate,
      profileImageUrl: profile.profileImageUrl,
      bio: profile.bio,
      profession: profile.profession,
      specialization: profile.specialization,
      preferredLanguage: profile.preferredLanguage,
      timezone: profile.timezone,
    };

    // Update profile
    profile.updateProfile({
      fullName: req.fullName,
      phone: req.phone,
      birthDate: req.birthDate,
      profileImageUrl: req.profileImageUrl,
      bio: req.bio,
      profession: req.profession,
      specialization: req.specialization,
      preferredLanguage: req.preferredLanguage,
      timezone: req.timezone,
    });

    // Save updated profile
    const saveResult = await this.profileRepo.save(profile);

    if (saveResult.isLeft()) {
      return left(new InvalidInputError('Failed to update profile'));
    }

    // Dispatch profile updated event
    try {
      const changedFields: string[] = [];

      if (req.fullName !== undefined && req.fullName !== oldValues.fullName) {
        changedFields.push('fullName');
      }
      if (req.phone !== undefined && req.phone !== oldValues.phone) {
        changedFields.push('phone');
      }
      if (
        req.birthDate !== undefined &&
        req.birthDate !== oldValues.birthDate
      ) {
        changedFields.push('birthDate');
      }
      if (
        req.profileImageUrl !== undefined &&
        req.profileImageUrl !== oldValues.profileImageUrl
      ) {
        changedFields.push('profileImageUrl');
      }
      if (req.bio !== undefined && req.bio !== oldValues.bio) {
        changedFields.push('bio');
      }
      if (
        req.profession !== undefined &&
        req.profession !== oldValues.profession
      ) {
        changedFields.push('profession');
      }
      if (
        req.specialization !== undefined &&
        req.specialization !== oldValues.specialization
      ) {
        changedFields.push('specialization');
      }
      if (
        req.preferredLanguage !== undefined &&
        req.preferredLanguage !== oldValues.preferredLanguage
      ) {
        changedFields.push('preferredLanguage');
      }
      if (req.timezone !== undefined && req.timezone !== oldValues.timezone) {
        changedFields.push('timezone');
      }

      if (changedFields.length > 0) {
        await this.eventDispatcher.dispatch(
          new UserProfileUpdatedEvent(
            profile.identityId.toString(),
            changedFields,
            new Date(),
          ),
        );
      }
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to dispatch profile updated event:', error);
    }

    return right({
      profileId: profile.id.toString(),
      fullName: profile.fullName,
      phone: profile.phone,
      birthDate: profile.birthDate,
      profileImageUrl: profile.profileImageUrl,
      bio: profile.bio,
      profession: profile.profession,
      specialization: profile.specialization,
      preferredLanguage: profile.preferredLanguage,
      timezone: profile.timezone,
      updatedAt: profile.updatedAt || new Date(),
    });
  }
}
