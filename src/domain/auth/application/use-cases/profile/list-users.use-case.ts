import { Injectable, Inject } from '@nestjs/common';
import { IUserAggregatedViewRepository } from '../../repositories/i-user-aggregated-view-repository';
import { Either, right } from '@/core/either';

export interface ListUsersRequest {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  profession?: string;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export interface UserListItem {
  identityId: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  nationalId: string;
  phone?: string | null;
  profileImageUrl?: string | null;
  bio?: string | null;
  profession?: string | null;
  specialization?: string | null;
  role: string;
  isActive: boolean;
  lastLogin?: Date | null;
  createdAt: Date;
}

export interface ListUsersResponse {
  items: UserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type ListUsersResult = Either<never, ListUsersResponse>;

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(IUserAggregatedViewRepository)
    private viewRepo: IUserAggregatedViewRepository,
  ) {}

  async execute(req: ListUsersRequest): Promise<ListUsersResult> {
    const page = req.page || 1;
    const limit = req.limit || 10;

    const result = await this.viewRepo.findForListing({
      page,
      limit,
      search: req.search,
      role: req.role,
      profession: req.profession,
      orderBy: req.orderBy || 'createdAt',
      order: req.order || 'desc',
    });

    if (result.isLeft()) {
      // Since we're using Either<never, ...>, we shouldn't have errors
      // But if we do, we can log and return empty result
      console.error('Failed to list users:', result.value);
      return right({
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      });
    }

    const data = result.value;
    const totalPages = Math.ceil(data.total / limit);

    return right({
      items: data.items.map(view => ({
        identityId: view.identityId,
        email: view.email,
        emailVerified: view.emailVerified,
        fullName: view.fullName,
        nationalId: view.nationalId,
        phone: view.phone,
        profileImageUrl: view.profileImageUrl,
        bio: view.bio,
        profession: view.profession,
        specialization: view.specialization,
        role: view.role,
        isActive: view.isActive,
        lastLogin: view.lastLogin,
        createdAt: view.createdAt,
      })),
      total: data.total,
      page: data.page,
      limit: data.limit,
      totalPages,
    });
  }
}