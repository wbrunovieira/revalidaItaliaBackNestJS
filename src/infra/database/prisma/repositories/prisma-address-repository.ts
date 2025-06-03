// src/infra/database/prisma/repositories/prisma-address-repository.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Either, left, right } from "@/core/either";
import { IAddressRepository } from "@/domain/auth/application/repositories/i-address-repository";
import { Address } from "@/domain/auth/enterprise/entities/address.entity";
import { UniqueEntityID } from "@/core/unique-entity-id";

@Injectable()
export class PrismaAddressRepository implements IAddressRepository {
  constructor(private prisma: PrismaService) {}


 async findById(id: string): Promise<Either<Error, Address | undefined>> {
    try {
      const row = await this.prisma.address.findUnique({
        where: { id },
      });

      if (!row) {

        return right(undefined);
      }


      const address = Address.create(
        {
          userId:     new UniqueEntityID(row.userId),
          street:     row.street,
          number:     row.number,
          complement: row.complement,
          district:   row.district,
          city:       row.city,
          state:      row.state,
          country:    row.country,
          postalCode: row.postalCode,
        },
        new UniqueEntityID(row.id)
      );

      return right(address);
    } catch (err: any) {
      return left(err);
    }
  }


  async create(address: Address): Promise<Either<Error, void>> {
    try {
      await this.prisma.address.create({
        data: {
          id:          address.id.toString(),
          userId:      address.userId.toString(),
          street:      address.street,
          number:      address.number,
          complement:  address.complement,
          district:    address.district,
          city:        address.city,
          state:       address.state,
          country:     address.country,
          postalCode:  address.postalCode,
        },
      });
      return right(undefined);
    } catch (err: any) {
      return left(new Error("Database error creating address"));
    }
  }

  async findByUserId(userId: string): Promise<Either<Error, Address[]>> {
    try {
      const rows = await this.prisma.address.findMany({
        where: { userId },
      });

      const addresses = rows.map(row =>
        Address.create(
          {
            userId:     new UniqueEntityID(row.userId),
            street:     row.street,
            number:     row.number,
            complement: row.complement,
            district:   row.district,
            city:       row.city,
            state:      row.state,
            country:    row.country,
            postalCode: row.postalCode,
          },
          new UniqueEntityID(row.id),
        )
      );

      return right(addresses);
    } catch (err: any) {
      return left(new Error("Database error fetching addresses"));
    }
  }

  async update(addr: Address): Promise<Either<Error, void>> {
    try {
      await this.prisma.address.update({
        where: { id: addr.id.toString() },
        data: {
          street:     addr.street,
          number:     addr.number,
          complement: addr.complement,
          district:   addr.district,
          city:       addr.city,
          state:      addr.state,
          country:    addr.country,
          postalCode: addr.postalCode,
        },
      });
      return right(undefined);
    } catch (err: any) {
      return left(err);
    }
  }


  async delete(id: string): Promise<Either<Error, void>> {
    try {
      await this.prisma.address.delete({
        where: { id },
      });
      return right(undefined);
    } catch (err: any) {
      return left(err);
    }
  }
  
}