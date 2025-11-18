import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy } from './google.strategy';
import { Profile, VerifyCallback } from 'passport-google-oauth20';

// Mock the envs module
jest.mock('../../config', () => ({
  envs: {
    googleClientId: 'test-client-id',
    googleClientSecret: 'test-client-secret',
    googleCallbackUrl: 'http://localhost:3000/auth/google/callback',
  },
}));

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleStrategy],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const accessToken = 'mock-access-token';
    const refreshToken = 'mock-refresh-token';

    it('should successfully extract user data from Google profile', async () => {
      const mockProfile: Partial<Profile> = {
        id: 'google-123',
        emails: [{ value: 'test@example.com', verified: true }],
        name: { givenName: 'John', familyName: 'Doe' },
        photos: [{ value: 'https://example.com/avatar.jpg' }],
      };

      const mockDone: VerifyCallback = jest.fn();

      await strategy.validate(
        accessToken,
        refreshToken,
        mockProfile as Profile,
        mockDone,
      );

      expect(mockDone).toHaveBeenCalledWith(null, {
        googleId: 'google-123',
        email: 'test@example.com',
        nombre: 'John',
        apellido: 'Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
      });
    });

    it('should handle profile without photos', async () => {
      const mockProfile: Partial<Profile> = {
        id: 'google-456',
        emails: [{ value: 'nophoto@example.com', verified: true }],
        name: { givenName: 'Jane', familyName: 'Smith' },
        photos: undefined,
      };

      const mockDone: VerifyCallback = jest.fn();

      await strategy.validate(
        accessToken,
        refreshToken,
        mockProfile as Profile,
        mockDone,
      );

      expect(mockDone).toHaveBeenCalledWith(null, {
        googleId: 'google-456',
        email: 'nophoto@example.com',
        nombre: 'Jane',
        apellido: 'Smith',
        avatarUrl: undefined,
      });
    });

    it('should handle profile with empty photos array', async () => {
      const mockProfile: Partial<Profile> = {
        id: 'google-789',
        emails: [{ value: 'emptyphotos@example.com', verified: true }],
        name: { givenName: 'Bob', familyName: 'Johnson' },
        photos: [],
      };

      const mockDone: VerifyCallback = jest.fn();

      await strategy.validate(
        accessToken,
        refreshToken,
        mockProfile as Profile,
        mockDone,
      );

      expect(mockDone).toHaveBeenCalledWith(null, {
        googleId: 'google-789',
        email: 'emptyphotos@example.com',
        nombre: 'Bob',
        apellido: 'Johnson',
        avatarUrl: undefined,
      });
    });

    it('should use empty string when givenName is missing', async () => {
      const mockProfile: Partial<Profile> = {
        id: 'google-101',
        emails: [{ value: 'noname@example.com', verified: true }],
        name: { familyName: 'LastNameOnly' },
        photos: [{ value: 'https://example.com/avatar.jpg' }],
      };

      const mockDone: VerifyCallback = jest.fn();

      await strategy.validate(
        accessToken,
        refreshToken,
        mockProfile as Profile,
        mockDone,
      );

      expect(mockDone).toHaveBeenCalledWith(null, {
        googleId: 'google-101',
        email: 'noname@example.com',
        nombre: '',
        apellido: 'LastNameOnly',
        avatarUrl: 'https://example.com/avatar.jpg',
      });
    });

    it('should use empty string when familyName is missing', async () => {
      const mockProfile: Partial<Profile> = {
        id: 'google-102',
        emails: [{ value: 'nolastname@example.com', verified: true }],
        name: { givenName: 'FirstNameOnly' },
        photos: [{ value: 'https://example.com/avatar.jpg' }],
      };

      const mockDone: VerifyCallback = jest.fn();

      await strategy.validate(
        accessToken,
        refreshToken,
        mockProfile as Profile,
        mockDone,
      );

      expect(mockDone).toHaveBeenCalledWith(null, {
        googleId: 'google-102',
        email: 'nolastname@example.com',
        nombre: 'FirstNameOnly',
        apellido: '',
        avatarUrl: 'https://example.com/avatar.jpg',
      });
    });

    it('should return error when email is missing', async () => {
      const mockProfile: Partial<Profile> = {
        id: 'google-999',
        emails: undefined,
        name: { givenName: 'John', familyName: 'Doe' },
        photos: [{ value: 'https://example.com/avatar.jpg' }],
      };

      const mockDone: VerifyCallback = jest.fn();

      await strategy.validate(
        accessToken,
        refreshToken,
        mockProfile as Profile,
        mockDone,
      );

      expect(mockDone).toHaveBeenCalledWith(
        expect.any(Error),
        false,
      );
      expect(mockDone.mock.calls[0][0].message).toBe(
        'No se pudo obtener el email de la cuenta de Google',
      );
    });

    it('should return error when emails array is empty', async () => {
      const mockProfile: Partial<Profile> = {
        id: 'google-888',
        emails: [],
        name: { givenName: 'John', familyName: 'Doe' },
        photos: [{ value: 'https://example.com/avatar.jpg' }],
      };

      const mockDone: VerifyCallback = jest.fn();

      await strategy.validate(
        accessToken,
        refreshToken,
        mockProfile as Profile,
        mockDone,
      );

      expect(mockDone).toHaveBeenCalledWith(
        expect.any(Error),
        false,
      );
      expect(mockDone.mock.calls[0][0].message).toBe(
        'No se pudo obtener el email de la cuenta de Google',
      );
    });

    it('should return error when email value is undefined', async () => {
      const mockProfile: Partial<Profile> = {
        id: 'google-777',
        emails: [{ value: undefined as any, verified: true }],
        name: { givenName: 'John', familyName: 'Doe' },
        photos: [{ value: 'https://example.com/avatar.jpg' }],
      };

      const mockDone: VerifyCallback = jest.fn();

      await strategy.validate(
        accessToken,
        refreshToken,
        mockProfile as Profile,
        mockDone,
      );

      expect(mockDone).toHaveBeenCalledWith(
        expect.any(Error),
        false,
      );
    });

    it('should handle errors during validation', async () => {
      const mockProfile: Partial<Profile> = {
        id: 'google-error',
        get emails() {
          throw new Error('Profile access error');
        },
        name: { givenName: 'John', familyName: 'Doe' },
      };

      const mockDone: VerifyCallback = jest.fn();

      await strategy.validate(
        accessToken,
        refreshToken,
        mockProfile as Profile,
        mockDone,
      );

      expect(mockDone).toHaveBeenCalledWith(
        expect.any(Error),
        false,
      );
      expect(mockDone.mock.calls[0][0].message).toBe('Profile access error');
    });

    it('should extract first email when multiple emails exist', async () => {
      const mockProfile: Partial<Profile> = {
        id: 'google-multi',
        emails: [
          { value: 'primary@example.com', verified: true },
          { value: 'secondary@example.com', verified: true },
        ],
        name: { givenName: 'Multi', familyName: 'Email' },
        photos: [{ value: 'https://example.com/avatar.jpg' }],
      };

      const mockDone: VerifyCallback = jest.fn();

      await strategy.validate(
        accessToken,
        refreshToken,
        mockProfile as Profile,
        mockDone,
      );

      expect(mockDone).toHaveBeenCalledWith(null, {
        googleId: 'google-multi',
        email: 'primary@example.com',
        nombre: 'Multi',
        apellido: 'Email',
        avatarUrl: 'https://example.com/avatar.jpg',
      });
    });

    it('should extract first photo when multiple photos exist', async () => {
      const mockProfile: Partial<Profile> = {
        id: 'google-photos',
        emails: [{ value: 'photos@example.com', verified: true }],
        name: { givenName: 'Photo', familyName: 'User' },
        photos: [
          { value: 'https://example.com/photo1.jpg' },
          { value: 'https://example.com/photo2.jpg' },
        ],
      };

      const mockDone: VerifyCallback = jest.fn();

      await strategy.validate(
        accessToken,
        refreshToken,
        mockProfile as Profile,
        mockDone,
      );

      expect(mockDone).toHaveBeenCalledWith(null, {
        googleId: 'google-photos',
        email: 'photos@example.com',
        nombre: 'Photo',
        apellido: 'User',
        avatarUrl: 'https://example.com/photo1.jpg',
      });
    });
  });
});
