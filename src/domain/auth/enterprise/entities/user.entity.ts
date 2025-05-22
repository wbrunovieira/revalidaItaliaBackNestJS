// src/domain/auth/enterprise/entities/user.entity.ts
import { Entity } from "@/core/entity";
import { Optional } from "@/core/types/optional";
import { UniqueEntityID } from "@/core/unique-entity-id";

export interface UserProps {
  name: string;
  email: string;
  password: string;
  cpf: string;
  phone?: string;
  paymentToken?: string | null;
  birthDate?: Date;
  lastLogin?: Date;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  role: "admin" | "tutor" | "student";
}

export class User extends Entity<UserProps> {

  toResponseObject(): Omit<UserProps, "password"> & { id: string } {
    const { password, ...rest } = this.props;
    return { id: this.id.toString(), ...(rest as any) };
  }

  // getters públicos
  get email(): string {
    return this.props.email;
  }
  get profileImageUrl(): string {
    return this.props.email;
  }
  get cpf(): string {
    return this.props.cpf;
  }
  get name(): string {
    return this.props.name;
  }
  get role(): UserProps["role"] {
    return this.props.role;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  public updateProfile(updates: {
    name?: string;
    email?: string;
    cpf?: string;
    role?: UserProps["role"];
  }) {
    if (updates.name) {
      this.props.name = updates.name;
      this.touch();
    }
    if (updates.email) {
      this.props.email = updates.email;
      this.touch();
    }
    if (updates.cpf) {
      this.props.cpf = updates.cpf;
      this.touch();
    }
    if (updates.role) {
      this.props.role = updates.role;
      this.touch();
    }
  }

  public get password(): string {
    return this.props.password;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public static create(
    props: Optional<UserProps, "createdAt" | "updatedAt">,
    id?: UniqueEntityID
  ) {
    const now = new Date();
    return new User(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id
    );
  }
}