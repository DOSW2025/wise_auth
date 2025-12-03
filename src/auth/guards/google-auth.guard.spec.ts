import { ExecutionContext } from '@nestjs/common';
import { GoogleAuthGuard } from './google-auth.guard';

describe('GoogleAuthGuard', () => {
  let guard: GoogleAuthGuard;

  beforeEach(() => {
    guard = new GoogleAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('handleRequest', () => {
    let mockExecutionContext: Partial<ExecutionContext>;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {};
      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      };
    });

    it('should return user when authentication is successful', () => {
      const mockUser = {
        googleId: 'google-123',
        email: 'test@example.com',
        nombre: 'John',
        apellido: 'Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      const result = guard.handleRequest(
        null,
        mockUser,
        null,
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toEqual(mockUser);
    });

    it('should return existing user from request when user parameter is null', () => {
      const existingUser = {
        googleId: 'google-456',
        email: 'existing@example.com',
        nombre: 'Jane',
        apellido: 'Smith',
        avatarUrl: 'https://example.com/avatar2.jpg',
      };

      mockRequest.user = existingUser;

      const result = guard.handleRequest(
        null,
        null,
        null,
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toEqual(existingUser);
    });

    it('should throw error when both user and request.user are missing', () => {
      expect(() =>
        guard.handleRequest(
          null,
          null,
          null,
          mockExecutionContext as ExecutionContext,
        ),
      ).toThrow('No se pudo autenticar con Google');
    });

    it('should throw error when err is provided', () => {
      const customError = new Error('Google OAuth error');

      expect(() =>
        guard.handleRequest(
          customError,
          null,
          null,
          mockExecutionContext as ExecutionContext,
        ),
      ).toThrow(customError);
    });

    it('should prioritize error over user data', () => {
      const customError = new Error('Custom error');
      const mockUser = {
        googleId: 'google-789',
        email: 'test@example.com',
        nombre: 'Test',
        apellido: 'User',
      };

      expect(() =>
        guard.handleRequest(
          customError,
          mockUser,
          null,
          mockExecutionContext as ExecutionContext,
        ),
      ).toThrow(customError);
    });

    it('should use fresh user data over cached request.user when available', () => {
      const cachedUser = {
        googleId: 'google-old',
        email: 'old@example.com',
        nombre: 'Old',
        apellido: 'User',
      };

      const freshUser = {
        googleId: 'google-new',
        email: 'new@example.com',
        nombre: 'New',
        apellido: 'User',
      };

      mockRequest.user = cachedUser;

      const result = guard.handleRequest(
        null,
        freshUser,
        null,
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toEqual(freshUser);
      expect(result).not.toEqual(cachedUser);
    });

    it('should handle info parameter gracefully', () => {
      const mockUser = {
        googleId: 'google-123',
        email: 'test@example.com',
        nombre: 'John',
        apellido: 'Doe',
      };

      const info = { message: 'Some OAuth info' };

      const result = guard.handleRequest(
        null,
        mockUser,
        info,
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toEqual(mockUser);
    });

    it('should fallback to request.user during OAuth flow', () => {
      // This simulates the scenario where Passport calls handleRequest
      // multiple times and the user is already in the request
      const userInRequest = {
        googleId: 'google-flow',
        email: 'flow@example.com',
        nombre: 'Flow',
        apellido: 'User',
      };

      mockRequest.user = userInRequest;

      const result = guard.handleRequest(
        null,
        null,
        null,
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toEqual(userInRequest);
    });

    it('should handle request without user property', () => {
      delete mockRequest.user;

      expect(() =>
        guard.handleRequest(
          null,
          null,
          null,
          mockExecutionContext as ExecutionContext,
        ),
      ).toThrow('No se pudo autenticar con Google');
    });

    it('should return user with all required fields', () => {
      const completeUser = {
        googleId: 'google-complete',
        email: 'complete@example.com',
        nombre: 'Complete',
        apellido: 'User',
        avatarUrl: 'https://example.com/complete.jpg',
      };

      const result = guard.handleRequest(
        null,
        completeUser,
        null,
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toHaveProperty('googleId');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('nombre');
      expect(result).toHaveProperty('apellido');
      expect(result.googleId).toBe('google-complete');
    });

    it('should handle user without avatarUrl', () => {
      const userWithoutAvatar = {
        googleId: 'google-no-avatar',
        email: 'noavatar@example.com',
        nombre: 'No',
        apellido: 'Avatar',
      };

      const result = guard.handleRequest(
        null,
        userWithoutAvatar,
        null,
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toEqual(userWithoutAvatar);
      expect(result.avatarUrl).toBeUndefined();
    });
  });
});
