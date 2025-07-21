import { UserAuthorization as PrismaUserAuthorization, UserRole as PrismaUserRole } from '@prisma/client';
import { UserAuthorization, UserRole, Permission, Restriction } from '../../enterprise/entities/user-authorization';
import { UniqueEntityID } from '@/core/unique-entity-id';

export class UserAuthorizationMapper {
  static toDomain(raw: PrismaUserAuthorization): UserAuthorization {
    const customPermissions = (raw.customPermissions as any[]) || [];
    const restrictions = (raw.restrictions as any[]) || [];

    return UserAuthorization.create(
      {
        identityId: new UniqueEntityID(raw.identityId),
        role: this.mapPrismaRoleToRole(raw.role),
        customPermissions: customPermissions.map(p => ({
          resource: p.resource,
          action: p.action,
        })),
        restrictions: restrictions.map(r => ({
          resource: r.resource,
          reason: r.reason,
        })),
        effectiveFrom: raw.effectiveFrom,
        effectiveUntil: raw.effectiveUntil,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPersistence(userAuthorization: UserAuthorization) {
    return {
      id: userAuthorization.id.toString(),
      identityId: userAuthorization.identityId.toString(),
      role: this.mapRoleToPrismaRole(userAuthorization.role),
      customPermissions: JSON.stringify(userAuthorization.customPermissions),
      restrictions: JSON.stringify(userAuthorization.restrictions),
      effectiveFrom: userAuthorization.effectiveFrom,
      effectiveUntil: userAuthorization.effectiveUntil,
      createdAt: userAuthorization.createdAt,
      updatedAt: userAuthorization.updatedAt,
    };
  }

  static toResponse(userAuthorization: UserAuthorization) {
    return {
      id: userAuthorization.id.toString(),
      role: userAuthorization.role,
      customPermissions: userAuthorization.customPermissions,
      restrictions: userAuthorization.restrictions,
      isActive: userAuthorization.isActive,
      effectiveFrom: userAuthorization.effectiveFrom,
      effectiveUntil: userAuthorization.effectiveUntil,
      createdAt: userAuthorization.createdAt,
      updatedAt: userAuthorization.updatedAt,
    };
  }

  private static mapPrismaRoleToRole(prismaRole: PrismaUserRole): UserRole {
    const roleMap: Record<PrismaUserRole, UserRole> = {
      admin: 'admin',
      tutor: 'tutor',
      student: 'student',
    };
    return roleMap[prismaRole];
  }

  private static mapRoleToPrismaRole(role: UserRole): PrismaUserRole {
    const roleMap: Record<UserRole, PrismaUserRole> = {
      admin: 'admin',
      tutor: 'tutor',
      student: 'student',
    };
    return roleMap[role];
  }
}