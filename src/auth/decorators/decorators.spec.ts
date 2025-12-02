import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Public, IS_PUBLIC_KEY } from './public.decorator';
import { Roles, ROLES_KEY } from './roles.decorator';
import { GetUser } from './get-user.decorator';
import { Role } from '../enums/role.enum';

describe('Auth Decorators', () => {
  describe('@Public', () => {
    it('should set IS_PUBLIC_KEY metadata to true', () => {
      class TestController {
        @Public()
        testMethod() {
          return 'test';
        }
      }

      const reflector = new Reflector();
      const metadata = reflector.get(IS_PUBLIC_KEY, TestController.prototype.testMethod);

      expect(metadata).toBe(true);
    });

    it('should be defined', () => {
      expect(Public).toBeDefined();
    });

    it('should return a decorator function', () => {
      const decorator = Public();
      expect(typeof decorator).toBe('function');
    });
  });

  describe('@Roles', () => {
    it('should set ROLES_KEY metadata with single role', () => {
      class TestController {
        @Roles(Role.ADMIN)
        testMethod() {
          return 'test';
        }
      }

      const reflector = new Reflector();
      const metadata = reflector.get(ROLES_KEY, TestController.prototype.testMethod);

      expect(metadata).toEqual([Role.ADMIN]);
    });

    it('should set ROLES_KEY metadata with multiple roles', () => {
      class TestController {
        @Roles(Role.ADMIN, Role.TUTOR)
        testMethod() {
          return 'test';
        }
      }

      const reflector = new Reflector();
      const metadata = reflector.get(ROLES_KEY, TestController.prototype.testMethod);

      expect(metadata).toEqual([Role.ADMIN, Role.TUTOR]);
    });

    it('should set ROLES_KEY metadata with all three roles', () => {
      class TestController {
        @Roles(Role.ADMIN, Role.TUTOR, Role.ESTUDIANTE)
        testMethod() {
          return 'test';
        }
      }

      const reflector = new Reflector();
      const metadata = reflector.get(ROLES_KEY, TestController.prototype.testMethod);

      expect(metadata).toEqual([Role.ADMIN, Role.TUTOR, Role.ESTUDIANTE]);
    });

    it('should be defined', () => {
      expect(Roles).toBeDefined();
    });

    it('should return a decorator function', () => {
      const decorator = Roles(Role.ADMIN);
      expect(typeof decorator).toBe('function');
    });

    it('should handle empty roles array', () => {
      class TestController {
        @Roles()
        testMethod() {
          return 'test';
        }
      }

      const reflector = new Reflector();
      const metadata = reflector.get(ROLES_KEY, TestController.prototype.testMethod);

      expect(metadata).toEqual([]);
    });
  });

  describe('@GetUser', () => {
    let mockExecutionContext: ExecutionContext;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        user: {
          id: '123',
          email: 'test@example.com',
          rol: Role.ESTUDIANTE,
          nombre: 'John',
          apellido: 'Doe',
        },
      };

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as any;
    });

    it('should be defined', () => {
      expect(GetUser).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof GetUser).toBe('function');
    });

    it('should return a parameter decorator', () => {
      const decorator = GetUser();
      expect(typeof decorator).toBe('function');
    });

    it('should return the entire user object when no property is specified', () => {
      // Access the internal factory function
      const callback = (GetUser as any).factory(undefined);
      const result = callback(undefined, mockExecutionContext);

      expect(result).toEqual(mockRequest.user);
    });

    it('should return a specific user property when data parameter is provided', () => {
      const emailCallback = (GetUser as any).factory('email');
      const emailResult = emailCallback('email', mockExecutionContext);
      expect(emailResult).toBe('test@example.com');

      const idCallback = (GetUser as any).factory('id');
      const idResult = idCallback('id', mockExecutionContext);
      expect(idResult).toBe('123');

      const rolCallback = (GetUser as any).factory('rol');
      const rolResult = rolCallback('rol', mockExecutionContext);
      expect(rolResult).toBe(Role.ESTUDIANTE);
    });

    it('should return undefined when accessing non-existent property', () => {
      const callback = (GetUser as any).factory('nonExistentProperty');
      const result = callback('nonExistentProperty', mockExecutionContext);

      expect(result).toBeUndefined();
    });

    it('should return undefined when user is not present in request', () => {
      mockRequest.user = undefined;

      const callback = (GetUser as any).factory(undefined);
      const result = callback(undefined, mockExecutionContext);

      expect(result).toBeUndefined();
    });

    it('should return undefined when accessing property on undefined user', () => {
      mockRequest.user = undefined;

      const callback = (GetUser as any).factory('email');
      const result = callback('email', mockExecutionContext);

      expect(result).toBeUndefined();
    });

    it('should work with different user properties', () => {
      const nombreCallback = (GetUser as any).factory('nombre');
      const nombreResult = nombreCallback('nombre', mockExecutionContext);
      expect(nombreResult).toBe('John');

      const apellidoCallback = (GetUser as any).factory('apellido');
      const apellidoResult = apellidoCallback('apellido', mockExecutionContext);
      expect(apellidoResult).toBe('Doe');
    });

    it('should accept optional data parameter', () => {
      expect(() => GetUser()).not.toThrow();
      expect(() => GetUser('email')).not.toThrow();
      expect(() => GetUser('id')).not.toThrow();
    });
  });
});
