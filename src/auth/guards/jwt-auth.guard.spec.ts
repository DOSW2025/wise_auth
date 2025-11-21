import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockExecutionContext: Partial<ExecutionContext>;

    beforeEach(() => {
      mockExecutionContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: { authorization: 'Bearer mock-token' },
          }),
          getResponse: jest.fn().mockReturnValue({}),
          getNext: jest.fn(),
        }),
        getType: jest.fn().mockReturnValue('http'),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
      };
    });

    it('should allow access to public routes', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext as ExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      expect(result).toBe(true);
    });

    it('should call super.canActivate for protected routes', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const superCanActivateSpy = jest.spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype),
        'canActivate',
      ).mockReturnValue(true);

      guard.canActivate(mockExecutionContext as ExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      expect(superCanActivateSpy).toHaveBeenCalled();

      superCanActivateSpy.mockRestore();
    });

    it('should check both handler and class for IS_PUBLIC_KEY', () => {
      const getAllAndOverrideSpy = jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(false);

      const superCanActivateSpy = jest.spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype),
        'canActivate',
      ).mockReturnValue(true);

      guard.canActivate(mockExecutionContext as ExecutionContext);

      expect(getAllAndOverrideSpy).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);

      superCanActivateSpy.mockRestore();
    });

    it('should return true when isPublic is true', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should delegate to parent guard when route is not public', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const parentCanActivate = jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext as ExecutionContext);

      expect(parentCanActivate).toHaveBeenCalledWith(mockExecutionContext);

      parentCanActivate.mockRestore();
    });
  });

  describe('handleRequest', () => {
    it('should return user when authentication is successful', () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        rol: 'estudiante',
      };

      const result = guard.handleRequest(null, mockUser, null);

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user is null', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user is undefined', () => {
      expect(() => guard.handleRequest(null, undefined, null)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException with info when token is invalid', () => {
      const info = { message: 'jwt expired' };

      expect(() => guard.handleRequest(null, null, info)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.handleRequest(null, null, info)).toThrow(
        'Invalid or expired token',
      );
    });

    it('should throw the original error when err is provided', () => {
      const customError = new Error('Custom authentication error');
      const mockUser = null;
      const info = null;

      expect(() => guard.handleRequest(customError, mockUser, info)).toThrow(
        customError,
      );
    });

    it('should prioritize error over missing user', () => {
      const customError = new Error('Custom error');

      expect(() => guard.handleRequest(customError, null, null)).toThrow(
        customError,
      );
    });

    it('should handle different user objects', () => {
      const mockUser1 = { id: 1, email: 'user1@test.com', rol: 'estudiante' };
      const mockUser2 = { id: 2, email: 'user2@test.com', rol: 'tutor' };
      const mockUser3 = { id: 3, email: 'user3@test.com', rol: 'admin' };

      expect(guard.handleRequest(null, mockUser1, null)).toEqual(mockUser1);
      expect(guard.handleRequest(null, mockUser2, null)).toEqual(mockUser2);
      expect(guard.handleRequest(null, mockUser3, null)).toEqual(mockUser3);
    });

    it('should include info in UnauthorizedException cause', () => {
      const info = { message: 'jwt malformed', name: 'JsonWebTokenError' };

      try {
        guard.handleRequest(null, null, info);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Invalid or expired token');
      }
    });
  });
});
