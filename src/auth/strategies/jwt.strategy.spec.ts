import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy, JwtPayload } from './jwt.strategy';
import { Role } from '../enums/role.enum';

// Mock the envs module
jest.mock('../../config', () => ({
  envs: {
    jwtsecret: 'test-secret-key',
  },
}));

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object when payload is valid', async () => {
      const payload: JwtPayload = {
        sub: '123',
        email: 'test@example.com',
        rol: Role.ESTUDIANTE,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: '123',
        email: 'test@example.com',
        rol: Role.ESTUDIANTE,
      });
    });

    it('should throw UnauthorizedException when sub is missing', async () => {
      const payload = {
        sub: '',
        email: 'test@example.com',
        rol: Role.ESTUDIANTE,
      } as JwtPayload;

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'Invalid token payload',
      );
    });

    it('should throw UnauthorizedException when email is missing', async () => {
      const payload = {
        sub: '123',
        email: '',
        rol: Role.ESTUDIANTE,
      } as JwtPayload;

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'Invalid token payload',
      );
    });

    it('should throw UnauthorizedException when rol is missing', async () => {
      const payload = {
        sub: '123',
        email: 'test@example.com',
        rol: null,
      } as any;

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'Invalid token payload',
      );
    });

    it('should throw UnauthorizedException when sub is undefined', async () => {
      const payload = {
        email: 'test@example.com',
        rol: Role.ESTUDIANTE,
      } as any;

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when email is undefined', async () => {
      const payload = {
        sub: '123',
        rol: Role.ESTUDIANTE,
      } as any;

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when rol is undefined', async () => {
      const payload = {
        sub: '123',
        email: 'test@example.com',
      } as any;

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should validate payload with TUTOR role', async () => {
      const payload: JwtPayload = {
        sub: '456',
        email: 'tutor@example.com',
        rol: Role.TUTOR,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: '456',
        email: 'tutor@example.com',
        rol: Role.TUTOR,
      });
    });

    it('should validate payload with ADMIN role', async () => {
      const payload: JwtPayload = {
        sub: '789',
        email: 'admin@example.com',
        rol: Role.ADMIN,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: '789',
        email: 'admin@example.com',
        rol: Role.ADMIN,
      });
    });

    it('should handle numeric user IDs as strings', async () => {
      const payload: JwtPayload = {
        sub: '999',
        email: 'numeric@example.com',
        rol: Role.ESTUDIANTE,
      };

      const result = await strategy.validate(payload);

      expect(result.id).toBe('999');
      expect(typeof result.id).toBe('string');
    });

    it('should preserve email exactly as provided in payload', async () => {
      const payload: JwtPayload = {
        sub: '123',
        email: 'Test.Email+123@Example.COM',
        rol: Role.ESTUDIANTE,
      };

      const result = await strategy.validate(payload);

      expect(result.email).toBe('Test.Email+123@Example.COM');
    });

    it('should map sub to id in returned object', async () => {
      const payload: JwtPayload = {
        sub: 'user-abc-123',
        email: 'test@example.com',
        rol: Role.ESTUDIANTE,
      };

      const result = await strategy.validate(payload);

      expect(result).toHaveProperty('id');
      expect(result).not.toHaveProperty('sub');
      expect(result.id).toBe('user-abc-123');
    });
  });
});
