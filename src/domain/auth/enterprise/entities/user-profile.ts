import { Optional } from '@/core/types/optional';
import { NationalId } from '../value-objects/national-id.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { Entity } from '@/core/entity';

export interface UserProfileProps {
  identityId: UniqueEntityID;
  fullName: string;
  nationalId: NationalId;
  phone?: string | null;
  birthDate?: Date | null;
  profileImageUrl?: string | null;
  bio?: string | null;
  profession?: string | null;
  specialization?: string | null;
  preferredLanguage: string;
  timezone: string;
  createdAt: Date;
  updatedAt?: Date | null;
}

export class UserProfile extends Entity<UserProfileProps> {
  get identityId() {
    return this.props.identityId;
  }

  get fullName() {
    return this.props.fullName;
  }

  set fullName(fullName: string) {
    this.props.fullName = fullName;
    this.touch();
  }

  get nationalId() {
    return this.props.nationalId;
  }

  get phone() {
    return this.props.phone;
  }

  set phone(phone: string | null | undefined) {
    this.props.phone = phone;
    this.touch();
  }

  get birthDate() {
    return this.props.birthDate;
  }

  set birthDate(birthDate: Date | null | undefined) {
    this.props.birthDate = birthDate;
    this.touch();
  }

  get profileImageUrl() {
    return this.props.profileImageUrl;
  }

  set profileImageUrl(url: string | null | undefined) {
    this.props.profileImageUrl = url;
    this.touch();
  }

  get bio() {
    return this.props.bio;
  }

  set bio(bio: string | null | undefined) {
    this.props.bio = bio;
    this.touch();
  }

  get profession() {
    return this.props.profession;
  }

  set profession(profession: string | null | undefined) {
    this.props.profession = profession;
    this.touch();
  }

  get specialization() {
    return this.props.specialization;
  }

  set specialization(specialization: string | null | undefined) {
    this.props.specialization = specialization;
    this.touch();
  }

  get preferredLanguage() {
    return this.props.preferredLanguage;
  }

  set preferredLanguage(language: string) {
    this.props.preferredLanguage = language;
    this.touch();
  }

  get timezone() {
    return this.props.timezone;
  }

  set timezone(timezone: string) {
    this.props.timezone = timezone;
    this.touch();
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get age(): number | null {
    if (!this.birthDate) return null;
    const today = new Date();
    const birthDate = new Date(this.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  updateProfile(data: {
    fullName?: string;
    phone?: string | null;
    birthDate?: Date | null;
    profileImageUrl?: string | null;
    bio?: string | null;
    profession?: string | null;
    specialization?: string | null;
    preferredLanguage?: string;
    timezone?: string;
  }) {
    if (data.fullName !== undefined) this.fullName = data.fullName;
    if (data.phone !== undefined) this.phone = data.phone;
    if (data.birthDate !== undefined) this.birthDate = data.birthDate;
    if (data.profileImageUrl !== undefined)
      this.profileImageUrl = data.profileImageUrl;
    if (data.bio !== undefined) this.bio = data.bio;
    if (data.profession !== undefined) this.profession = data.profession;
    if (data.specialization !== undefined)
      this.specialization = data.specialization;
    if (data.preferredLanguage !== undefined)
      this.preferredLanguage = data.preferredLanguage;
    if (data.timezone !== undefined) this.timezone = data.timezone;
  }

  updateNationalId(nationalId: NationalId) {
    this.props.nationalId = nationalId;
    this.touch();
  }

  updateFullName(fullName: string) {
    this.fullName = fullName;
  }

  updatePhone(phone: string | null | undefined) {
    this.phone = phone;
  }

  updateBirthDate(birthDate: Date | null | undefined) {
    this.birthDate = birthDate;
  }

  updateProfileImageUrl(url: string | null | undefined) {
    this.profileImageUrl = url;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      UserProfileProps,
      'createdAt' | 'preferredLanguage' | 'timezone'
    >,
    id?: UniqueEntityID,
  ) {
    const userProfile = new UserProfile(
      {
        ...props,
        preferredLanguage: props.preferredLanguage ?? 'pt-BR',
        timezone: props.timezone ?? 'America/Sao_Paulo',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return userProfile;
  }
}
