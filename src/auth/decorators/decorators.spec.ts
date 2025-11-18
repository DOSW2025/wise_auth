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
        testMethod() {}
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
        testMethod() {}
      }

      const reflector = new Reflector();
      const metadata = reflector.get(ROLES_KEY, TestController.prototype.testMethod);

      expect(metadata).toEqual([Role.ADMIN]);
    });

    it('should set ROLES_KEY metadata with multiple roles', () => {
      class TestController {
        @Roles(Role.ADMIN, Role.TUTOR)
        testMethod() {}
      }

      const reflector = new Reflector();
      const metadata = reflector.get(ROLES_KEY, TestController.prototype.testMethod);

      expect(metadata).toEqual([Role.ADMIN, Role.TUTOR]);
    });

    it('should set ROLES_KEY metadata with all three roles', () => {
      class TestController {
        @Roles(Role.ADMIN, Role.TUTOR, Role.ESTUDIANTE)
        testMethod() {}
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
        testMethod() {}
      }

      const reflector = new Reflector();
      const metadata = reflector.get(ROLES_KEY, TestController.prototype.testMethod);

      expect(metadata).toEqual([]);
    });
  });

  describe('@GetUser', () => {
    it('should be defined', () => {
      expect(GetUser).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof GetUser).toBe('function');
    });

    it('should return a parameter decorator', () => {
      // GetUser is a parameter decorator factory
      // When called, it should return a decorator function
      const decorator = GetUser();
      expect(typeof decorator).toBe('function');
    });

    it('should accept optional data parameter', () => {
      // Should not throw when called with no arguments
      expect(() => GetUser()).not.toThrow();

      // Should not throw when called with a string argument
      expect(() => GetUser('email')).not.toThrow();
    });
  });
});
