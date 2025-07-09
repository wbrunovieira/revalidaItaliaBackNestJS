// src/domain/auth/enterprise/entities/user.entity.ts

import { Entity } from '@/core/entity';
import { Optional } from '@/core/types/optional';
import { UniqueEntityID } from '@/core/unique-entity-id';

export interface AddressProps {
  userId: UniqueEntityID;
  street: string;
  number: string;
  complement?: string | null;
  district?: string | null;
  city: string;
  state?: string | null;
  country: string;
  postalCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Address extends Entity<AddressProps> {
  toResponseObjectPartial(): Partial<Omit<AddressProps, 'userId'>> & {
    id: string;
  } {
    const { userId, ...addr } = this.props;
    return {
      id: this.id.toString(),
      ...addr,
    };
  }

  toResponseObject(): Omit<AddressProps, 'userId'> & { id: string } {
    const { userId, ...addr } = this.props;
    return {
      id: this.id.toString(),
      ...addr,
    };
  }

  get userId(): UniqueEntityID {
    return this.props.userId;
  }
  get street(): string {
    return this.props.street;
  }
  get number(): string {
    return this.props.number;
  }
  get complement(): string | null {
    return this.props.complement || null;
  }
  get district(): string | null {
    return this.props.district || null;
  }
  get city(): string {
    return this.props.city;
  }
  get state(): string | null {
    return this.props.state || null;
  }
  get country(): string {
    return this.props.country;
  }
  get postalCode(): string {
    return this.props.postalCode;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  set street(value: string) {
    this.props.street = value;
    this.touch();
  }
  set number(value: string) {
    this.props.number = value;
    this.touch();
  }
  set complement(value: string | null) {
    this.props.complement = value;
    this.touch();
  }
  set district(value: string | null) {
    this.props.district = value;
    this.touch();
  }
  set city(value: string) {
    this.props.city = value;
    this.touch();
  }
  set state(value: string | null) {
    this.props.state = value;
    this.touch();
  }
  set country(value: string) {
    this.props.country = value;
    this.touch();
  }
  set postalCode(value: string) {
    this.props.postalCode = value;
    this.touch();
  }

  public static create(
    props: Optional<AddressProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ) {
    const address = new Address(
      {
        ...props,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );
    return address;
  }
}
