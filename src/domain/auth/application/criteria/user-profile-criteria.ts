// src/domain/auth/application/criteria/user-profile-criteria.ts
import { BaseCriteria } from '@/core/criteria/base-criteria';

export class UserProfileCriteria extends BaseCriteria<any> {
  byFullName(name: string, exact = false) {
    if (exact) {
      this.conditions.push({ fullName: name });
    } else {
      this.conditions.push({
        fullName: { contains: name, mode: 'insensitive' },
      });
    }
    return this;
  }

  byProfession(profession: string) {
    this.conditions.push({ profession });
    return this;
  }

  bySpecialization(specialization: string) {
    this.conditions.push({ specialization });
    return this;
  }

  byPreferredLanguage(language: string) {
    this.conditions.push({ preferredLanguage: language });
    return this;
  }

  hasProfileImage() {
    this.conditions.push({ profileImageUrl: { not: null } });
    return this;
  }

  hasBio() {
    this.conditions.push({ bio: { not: null } });
    return this;
  }

  byAgeRange(minAge?: number, maxAge?: number) {
    const now = new Date();
    const conditions: any = {};

    if (maxAge !== undefined) {
      const minBirthDate = new Date(
        now.getFullYear() - maxAge - 1,
        now.getMonth(),
        now.getDate(),
      );
      conditions.gte = minBirthDate;
    }

    if (minAge !== undefined) {
      const maxBirthDate = new Date(
        now.getFullYear() - minAge,
        now.getMonth(),
        now.getDate(),
      );
      conditions.lte = maxBirthDate;
    }

    if (Object.keys(conditions).length > 0) {
      this.conditions.push({ birthDate: conditions });
    }

    return this;
  }

  createdAfter(date: Date) {
    this.conditions.push({ createdAt: { gte: date } });
    return this;
  }

  createdBefore(date: Date) {
    this.conditions.push({ createdAt: { lte: date } });
    return this;
  }

  build() {
    const query: any = {};

    // Build WHERE clause
    if (this.conditions.length > 0) {
      query.where =
        this.conditions.length === 1
          ? this.conditions[0]
          : { AND: this.conditions };
    }

    // Build ORDER BY
    if (this.orderByField) {
      query.orderBy = {
        [this.orderByField.field]: this.orderByField.direction,
      };
    }

    // Build pagination
    if (this.paginationConfig) {
      query.skip = this.paginationConfig.skip;
      query.take = this.paginationConfig.take;
    }

    return query;
  }
}
