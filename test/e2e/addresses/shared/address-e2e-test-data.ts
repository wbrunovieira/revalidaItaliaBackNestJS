// test/e2e/addresses/shared/address-e2e-test-data.ts

interface AddressData {
  profileId?: string;
  street: string;
  number: string;
  complement?: string;
  district?: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
}

export class AddressE2ETestData {
  static validAddress<T extends Partial<AddressData>>(
    overrides?: T,
  ): Omit<AddressData, 'profileId'> & T {
    return {
      street: '100 Elm St',
      number: '10B',
      complement: 'Suite 5',
      district: 'Downtown',
      city: 'Cityville',
      state: 'Stateburg',
      country: 'Countryland',
      postalCode: '00011-223',
      ...overrides,
    } as Omit<AddressData, 'profileId'> & T;
  }

  static validUser(overrides?: Partial<any>) {
    return {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Aa11@@aa',
      nationalId: '12345678901',
      role: 'student',
      ...overrides,
    };
  }

  static readonly testUsers = {
    user1: {
      name: 'Addr User1',
      email: 'addr-user1@example.com',
      password: 'Aa11@@aa',
      nationalId: '90090090090',
      role: 'student',
    },
    user2: {
      name: 'Addr User2',
      email: 'addr-user2@example.com',
      password: 'Bb22##bb',
      nationalId: '80880880880',
      role: 'student',
    },
    getUser: {
      name: 'Get Addr User',
      email: 'get-addr@example.com',
      password: 'Cc33$$cc',
      nationalId: '70770770770',
      role: 'student',
    },
    patchUser: {
      name: 'Patch Addr User',
      email: 'patch-addr@example.com',
      password: 'Dd44%%dd',
      nationalId: '60660660660',
      role: 'student',
    },
    duplicateUser: {
      name: 'Duplicate Addr User',
      email: 'duplicate-addr@example.com',
      password: 'Ee55^^ee',
      nationalId: '50550550550',
      role: 'student',
    },
    postalCodeUser: {
      name: 'Postal Code User',
      email: 'postal-addr@example.com',
      password: 'Ff66&&ff',
      nationalId: '40440440440',
      role: 'student',
    },
    lengthUser: {
      name: 'Length Test User',
      email: 'length-addr@example.com',
      password: 'Gg77**gg',
      nationalId: '30330330330',
      role: 'student',
    },
    securityUser: {
      name: 'Security Test User',
      email: 'security-addr@example.com',
      password: 'Hh88((hh',
      nationalId: '20220220220',
      role: 'student',
    },
  };

  static readonly invalidUUID = '550e8400-e29b-41d4-a716-446655440099';
}