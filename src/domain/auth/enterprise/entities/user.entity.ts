import { Entity } from "src/core/entity";
import { Optional } from "src/core/types/optional";
import { UniqueEntityID } from "src/core/unique-entity-id";


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
    role:  "admin"  | "tutor" | "student";
}

export class User extends Entity<UserProps> {
    toResponseObjectPartial(): Partial<Omit<UserProps, "password">> & {
        id: string;
    } {
        const { password, ...userWithoutPassword } = this.props;
        return {
            id: this.id.toString(),
            ...userWithoutPassword,
        };
    }

    toResponseObject(): Omit<UserProps, "password"> & { id: string } {
        const { password, ...userWithoutPassword } = this.props;
        return {
            id: this.id.toString(),
            ...(userWithoutPassword as Omit<UserProps, "password">),
        };
    }

    get name(): string {
        return this.props.name;
    }

    get cpf(): string {
        return this.props.cpf;
    }



    get role(): string {
        return this.props.role;
    }

    get email(): string {
        return this.props.email;
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

    set name(value: string) {
        this.props.name = value;
        this.touch();
    }



    set profileImageUrl(value: string) {
        this.props.profileImageUrl = value;
        this.touch();
    }



    set phone(value: string) {
        this.props.phone = value;
        this.touch();
    }

 

    get birthDate(): Date | null {
        return this.props.birthDate || null;
    }

    set birthDate(value: Date) {
        this.props.birthDate = value;
        this.touch();
    }


    get phone(): string | null {
        return this.props.phone || null;
    }



    get lastLogin(): Date | null {
        return this.props.lastLogin || null;
    }

    set lastLogin(value: Date) {
        this.props.lastLogin = value;
        this.touch();
    }





    get profileImageUrl(): string | null {
        return this.props.profileImageUrl || null;
    }

    public static create(
        props: Optional<UserProps, "createdAt" | "updatedAt">,
        id?: UniqueEntityID
    ) {
        const user = new User(
            {
                ...props,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            id
        );
        return user;
    }
}