import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infra/database/database.module';
import { IAddressRepository } from '@/domain/auth/application/repositories/i-address-repository';
import { PrismaAddressRepository } from '@/infra/database/prisma/repositories/prisma-address-repository';

import { CreateAddressUseCase } from '@/domain/auth/application/use-cases/create-address.use-case';
import { FindAddressByUserUseCase } from '@/domain/auth/application/use-cases/find-address-by-user.use-case';
import { UpdateAddressUseCase } from '@/domain/auth/application/use-cases/update-address.use-case';
import { DeleteAddressUseCase } from '@/domain/auth/application/use-cases/delete-address.use-case';

import { AddressController } from '@/infra/controllers/address.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AddressController],
  providers: [
    // Repository bindings
    { provide: IAddressRepository, useClass: PrismaAddressRepository },

    // Domain use cases
    CreateAddressUseCase,
    FindAddressByUserUseCase,
    UpdateAddressUseCase,
    DeleteAddressUseCase,
  ],
  exports: [
    // Export repository and use cases if needed by other modules
    IAddressRepository,
    CreateAddressUseCase,
    FindAddressByUserUseCase,
    UpdateAddressUseCase,
    DeleteAddressUseCase,
  ],
})
export class AddressModule {}