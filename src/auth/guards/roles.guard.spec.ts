import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockExecutionContext: Partial<ExecutionContext>;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        user: {
          id: 1,
          email: 'test@example.com',
          rol: Role.ESTUDIANTE,
        },
      };

      mockExecutionContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      };
    });

    it('should allow access when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access when required roles array is empty', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      const result = guard.canActivate(mockExecutionContext as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has required role (ESTUDIANTE)', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ESTUDIANTE]);

      const result = guard.canActivate(mockExecutionContext as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access when user role matches one of multiple required roles', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ADMIN, Role.TUTOR, Role.ESTUDIANTE]);

      const result = guard.canActivate(mockExecutionContext as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should deny access when user does not have required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      expect(() =>
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow(ForbiddenException);
      expect(() =>
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow('Se requiere uno de los siguientes roles: admin');
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const contextWithoutUser = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ user: null }),
        }),
      };

      expect(() =>
        guard.canActivate(contextWithoutUser as ExecutionContext),
      ).toThrow(ForbiddenException);
      expect(() =>
        guard.canActivate(contextWithoutUser as ExecutionContext),
      ).toThrow('Usuario no autenticado');
    });

    it('should throw ForbiddenException when user is undefined', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ESTUDIANTE]);

      const contextWithoutUser = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({}),
        }),
      };

      expect(() =>
        guard.canActivate(contextWithoutUser as ExecutionContext),
      ).toThrow(ForbiddenException);
      expect(() =>
        guard.canActivate(contextWithoutUser as ExecutionContext),
      ).toThrow('Usuario no autenticado');
    });

    it('should allow TUTOR to access TUTOR-only routes', () => {
      mockRequest.user.rol = Role.TUTOR;
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.TUTOR]);

      const result = guard.canActivate(mockExecutionContext as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow ADMIN to access ADMIN-only routes', () => {
      mockRequest.user.rol = Role.ADMIN;
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const result = guard.canActivate(mockExecutionContext as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should deny ESTUDIANTE access to ADMIN routes', () => {
      mockRequest.user.rol = Role.ESTUDIANTE;
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      expect(() =>
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow(ForbiddenException);
      expect(() =>
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow('Se requiere uno de los siguientes roles: admin');
    });

    it('should deny ESTUDIANTE access to TUTOR routes', () => {
      mockRequest.user.rol = Role.ESTUDIANTE;
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.TUTOR]);

      expect(() =>
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow(ForbiddenException);
      expect(() =>
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow('Se requiere uno de los siguientes roles: tutor');
    });

    it('should check roles from both handler and class metadata', () => {
      const getAllAndOverrideSpy = jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ESTUDIANTE]);

      guard.canActivate(mockExecutionContext as ExecutionContext);

      expect(getAllAndOverrideSpy).toHaveBeenCalledWith(ROLES_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should handle multiple required roles and show them in error message', () => {
      mockRequest.user.rol = Role.ESTUDIANTE;
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ADMIN, Role.TUTOR]);

      expect(() =>
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow('Se requiere uno de los siguientes roles: admin, tutor');
    });

    it('should allow access when user has one of multiple required roles', () => {
      mockRequest.user.rol = Role.TUTOR;
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ADMIN, Role.TUTOR]);

      const result = guard.canActivate(mockExecutionContext as ExecutionContext);

      expect(result).toBe(true);
    });
  });
});
