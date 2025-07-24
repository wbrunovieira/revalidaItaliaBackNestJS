// src/domain/auth/application/use-cases/profile/update-user-profile.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { validateSync } from 'class-validator';
import { IUserProfileRepository } from '../../repositories/i-user-profile-repository';
import { Either, left, right } from '@/core/either';
import {
  ResourceNotFoundError,
  InvalidInputError,
  RepositoryError,
} from '@/domain/auth/domain/exceptions';
import {
  IEventDispatcher,
  EVENT_DISPATCHER,
} from '@/core/domain/events/i-event-dispatcher';
import { UserProfileUpdatedEvent } from '@/domain/auth/enterprise/events/user-profile-updated.event';
import { UpdateUserProfileRequestDto } from '../../dtos/update-user-profile-request.dto';
import { UpdateUserProfileResponseDto } from '../../dtos/update-user-profile-response.dto';

export type UpdateUserProfileResult = Either<
  ResourceNotFoundError | InvalidInputError | RepositoryError,
  UpdateUserProfileResponseDto
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
    request: UpdateUserProfileRequestDto,
  ): Promise<UpdateUserProfileResult> {
    // Validate DTO
    const dto = Object.assign(new UpdateUserProfileRequestDto(), request);
    const errors = validateSync(dto);

    if (errors.length > 0) {
      const details = errors.flatMap((error) =>
        Object.entries(error.constraints || {}).map(([code, message]) => ({
          code,
          message,
          path: [error.property],
        })),
      );
      return left(new InvalidInputError('Validation failed', details));
    }

    // Check if at least one field is being updated
    const updateableFields = [
      'fullName', 'phone', 'birthDate', 'profileImageUrl',
      'bio', 'profession', 'specialization', 'preferredLanguage', 'timezone'
    ];
    const hasFieldsToUpdate = updateableFields.some(
      field => request[field as keyof UpdateUserProfileRequestDto] !== undefined
    );

    if (!hasFieldsToUpdate) {
      return left(
        new InvalidInputError('At least one field must be provided for update', [
          {
            code: 'missingFields',
            message: 'At least one field must be provided for update',
            path: ['request'],
          },
        ]),
      );
    }

    try {
      // Find the profile
      const profileResult = await this.profileRepo.findById(request.profileId);

      if (profileResult.isLeft()) {
        return left(ResourceNotFoundError.withId('Profile', request.profileId));
      }

      const profile = profileResult.value;
      if (!profile) {
        return left(ResourceNotFoundError.withId('Profile', request.profileId));
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
        fullName: request.fullName,
        phone: request.phone,
        birthDate: request.birthDate ? new Date(request.birthDate) : request.birthDate === null ? null : undefined,
        profileImageUrl: request.profileImageUrl,
        bio: request.bio,
        profession: request.profession,
        specialization: request.specialization,
        preferredLanguage: request.preferredLanguage,
        timezone: request.timezone,
      });

      // Save updated profile
      const saveResult = await this.profileRepo.save(profile);

      if (saveResult.isLeft()) {
        return left(
          RepositoryError.operationFailed(
            'save profile',
            saveResult.value,
          ),
        );
      }

      // Dispatch profile updated event
      try {
        const changedFields: string[] = [];

        if (request.fullName !== undefined && request.fullName !== oldValues.fullName) {
          changedFields.push('fullName');
        }
        if (request.phone !== undefined && request.phone !== oldValues.phone) {
          changedFields.push('phone');
        }
        if (
          request.birthDate !== undefined &&
          request.birthDate !== oldValues.birthDate?.toISOString()
        ) {
          changedFields.push('birthDate');
        }
        if (
          request.profileImageUrl !== undefined &&
          request.profileImageUrl !== oldValues.profileImageUrl
        ) {
          changedFields.push('profileImageUrl');
        }
        if (request.bio !== undefined && request.bio !== oldValues.bio) {
          changedFields.push('bio');
        }
        if (
          request.profession !== undefined &&
          request.profession !== oldValues.profession
        ) {
          changedFields.push('profession');
        }
        if (
          request.specialization !== undefined &&
          request.specialization !== oldValues.specialization
        ) {
          changedFields.push('specialization');
        }
        if (
          request.preferredLanguage !== undefined &&
          request.preferredLanguage !== oldValues.preferredLanguage
        ) {
          changedFields.push('preferredLanguage');
        }
        if (request.timezone !== undefined && request.timezone !== oldValues.timezone) {
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
    } catch (error: any) {
      return left(
        RepositoryError.operationFailed(
          'updateProfile',
          error instanceof Error ? error : new Error('Unknown error'),
        ),
      );
    }
  }
}
