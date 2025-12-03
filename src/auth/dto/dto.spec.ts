import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { GoogleUserDto } from './google-user.dto';
import { AuthResponseDto, UserResponseDto } from './auth-response.dto';

import { NotificacionesDto, TemplateNotificacionesEnum } from './notificaciones.dto';

describe('DTOs', () => {
  describe('GoogleUserDto', () => {
    it('should validate a correct GoogleUserDto', async () => {
      const dto = plainToInstance(GoogleUserDto, {
        googleId: 'google-123',
        email: 'test@example.com',
        nombre: 'John',
        apellido: 'Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate GoogleUserDto without optional avatarUrl', async () => {
      const dto = plainToInstance(GoogleUserDto, {
        googleId: 'google-123',
        email: 'test@example.com',
        nombre: 'John',
        apellido: 'Doe',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when googleId is missing', async () => {
      const dto = plainToInstance(GoogleUserDto, {
        email: 'test@example.com',
        nombre: 'John',
        apellido: 'Doe',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('googleId');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when email is missing', async () => {
      const dto = plainToInstance(GoogleUserDto, {
        googleId: 'google-123',
        nombre: 'John',
        apellido: 'Doe',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const emailError = errors.find((e) => e.property === 'email');
      expect(emailError).toBeDefined();
      expect(emailError?.constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when email format is invalid', async () => {
      const dto = plainToInstance(GoogleUserDto, {
        googleId: 'google-123',
        email: 'invalid-email',
        nombre: 'John',
        apellido: 'Doe',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const emailError = errors.find((e) => e.property === 'email');
      expect(emailError).toBeDefined();
      expect(emailError?.constraints).toHaveProperty('isEmail');
    });

    it('should fail validation when nombre is missing', async () => {
      const dto = plainToInstance(GoogleUserDto, {
        googleId: 'google-123',
        email: 'test@example.com',
        apellido: 'Doe',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nombreError = errors.find((e) => e.property === 'nombre');
      expect(nombreError).toBeDefined();
      expect(nombreError?.constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when apellido is missing', async () => {
      const dto = plainToInstance(GoogleUserDto, {
        googleId: 'google-123',
        email: 'test@example.com',
        nombre: 'John',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const apellidoError = errors.find((e) => e.property === 'apellido');
      expect(apellidoError).toBeDefined();
      expect(apellidoError?.constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when googleId is not a string', async () => {
      const dto = plainToInstance(GoogleUserDto, {
        googleId: 123,
        email: 'test@example.com',
        nombre: 'John',
        apellido: 'Doe',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const googleIdError = errors.find((e) => e.property === 'googleId');
      expect(googleIdError).toBeDefined();
      expect(googleIdError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when nombre is not a string', async () => {
      const dto = plainToInstance(GoogleUserDto, {
        googleId: 'google-123',
        email: 'test@example.com',
        nombre: 123,
        apellido: 'Doe',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nombreError = errors.find((e) => e.property === 'nombre');
      expect(nombreError).toBeDefined();
      expect(nombreError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when apellido is not a string', async () => {
      const dto = plainToInstance(GoogleUserDto, {
        googleId: 'google-123',
        email: 'test@example.com',
        nombre: 'John',
        apellido: 123,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const apellidoError = errors.find((e) => e.property === 'apellido');
      expect(apellidoError).toBeDefined();
      expect(apellidoError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when avatarUrl is not a string', async () => {
      const dto = plainToInstance(GoogleUserDto, {
        googleId: 'google-123',
        email: 'test@example.com',
        nombre: 'John',
        apellido: 'Doe',
        avatarUrl: 123,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const avatarError = errors.find((e) => e.property === 'avatarUrl');
      expect(avatarError).toBeDefined();
      expect(avatarError?.constraints).toHaveProperty('isString');
    });
  });

  describe('UserResponseDto', () => {
    it('should validate a correct UserResponseDto', async () => {
      const dto = plainToInstance(UserResponseDto, {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        nombre: 'John',
        apellido: 'Doe',
        rol: 'estudiante',
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate UserResponseDto without optional avatarUrl', async () => {
      const dto = plainToInstance(UserResponseDto, {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        nombre: 'John',
        apellido: 'Doe',
        rol: 'estudiante',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate UserResponseDto with null avatarUrl', async () => {
      const dto = plainToInstance(UserResponseDto, {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        nombre: 'John',
        apellido: 'Doe',
        rol: 'estudiante',
        avatarUrl: null,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when id is not a UUID', async () => {
      const dto = plainToInstance(UserResponseDto, {
        id: 'not-a-uuid',
        email: 'test@example.com',
        nombre: 'John',
        apellido: 'Doe',
        rol: 'estudiante',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const idError = errors.find((e) => e.property === 'id');
      expect(idError).toBeDefined();
      expect(idError?.constraints).toHaveProperty('isUuid');
    });

    it('should fail validation when email format is invalid', async () => {
      const dto = plainToInstance(UserResponseDto, {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'invalid-email',
        nombre: 'John',
        apellido: 'Doe',
        rol: 'estudiante',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const emailError = errors.find((e) => e.property === 'email');
      expect(emailError).toBeDefined();
      expect(emailError?.constraints).toHaveProperty('isEmail');
    });

    it('should fail validation when nombre is not a string', async () => {
      const dto = plainToInstance(UserResponseDto, {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        nombre: 123,
        apellido: 'Doe',
        rol: 'estudiante',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nombreError = errors.find((e) => e.property === 'nombre');
      expect(nombreError).toBeDefined();
      expect(nombreError?.constraints).toHaveProperty('isString');
    });
  });

  describe('AuthResponseDto', () => {
    it('should validate a correct AuthResponseDto', async () => {
      const dto = plainToInstance(AuthResponseDto, {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          nombre: 'John',
          apellido: 'Doe',
          rol: 'estudiante',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when access_token is empty', async () => {
      const dto = plainToInstance(AuthResponseDto, {
        access_token: '',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          nombre: 'John',
          apellido: 'Doe',
          rol: 'estudiante',
        },
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const tokenError = errors.find((e) => e.property === 'access_token');
      expect(tokenError).toBeDefined();
      expect(tokenError?.constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when access_token is not a string', async () => {
      const dto = plainToInstance(AuthResponseDto, {
        access_token: 123,
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          nombre: 'John',
          apellido: 'Doe',
          rol: 'estudiante',
        },
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const tokenError = errors.find((e) => e.property === 'access_token');
      expect(tokenError).toBeDefined();
      expect(tokenError?.constraints).toHaveProperty('isString');
    });
  });

  describe('NotificacionesDto', () => {
    it('should validate a correct NotificacionesDto', async () => {
      const dto = plainToInstance(NotificacionesDto, {
        email: 'rekow19685@bablace.com',
        name: 'Jared Farfan',
        id: '123e4567-e89b-12d3-a456-426614174000',
        template: TemplateNotificacionesEnum.NUEVO_USUARIO,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.email).toBe('rekow19685@bablace.com');
      expect(dto.name).toBe('Jared Farfan');
      expect(dto.template).toBe('nuevoUsuario');
    });

    it('should validate with template as string', async () => {
      const dto = plainToInstance(NotificacionesDto, {
        email: 'test@example.com',
        name: 'Test User',
        id: 'abc-123',
        template: 'nuevoUsuario',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when email is missing', async () => {
      const dto = plainToInstance(NotificacionesDto, {
        name: 'Test User',
        id: 'abc-123',
        template: TemplateNotificacionesEnum.NUEVO_USUARIO,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const emailError = errors.find((e) => e.property === 'email');
      expect(emailError).toBeDefined();
    });

    it('should fail validation when email format is invalid', async () => {
      const dto = plainToInstance(NotificacionesDto, {
        email: 'invalid-email',
        name: 'Test User',
        id: 'abc-123',
        template: TemplateNotificacionesEnum.NUEVO_USUARIO,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const emailError = errors.find((e) => e.property === 'email');
      expect(emailError).toBeDefined();
      expect(emailError?.constraints).toHaveProperty('isEmail');
    });

    it('should fail validation when name is missing', async () => {
      const dto = plainToInstance(NotificacionesDto, {
        email: 'test@example.com',
        id: 'abc-123',
        template: TemplateNotificacionesEnum.NUEVO_USUARIO,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find((e) => e.property === 'name');
      expect(nameError).toBeDefined();
    });

    it('should fail validation when name is not a string', async () => {
      const dto = plainToInstance(NotificacionesDto, {
        email: 'test@example.com',
        name: 123,
        id: 'abc-123',
        template: TemplateNotificacionesEnum.NUEVO_USUARIO,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find((e) => e.property === 'name');
      expect(nameError).toBeDefined();
      expect(nameError?.constraints).toHaveProperty('isString');
    });

    it('should accept different valid email formats', async () => {
      const emails = [
        'user@example.com',
        'test.user@example.co.uk',
        'user+tag@example.com',
        'rekow19685@bablace.com',
      ];

      for (const email of emails) {
        const dto = plainToInstance(NotificacionesDto, {
          email,
          name: 'Test User',
          id: 'test-id',
          template: TemplateNotificacionesEnum.NUEVO_USUARIO,
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });

    it('should validate with TemplateNotificacionesEnum.NUEVO_USUARIO', async () => {
      const dto = plainToInstance(NotificacionesDto, {
        email: 'test@example.com',
        name: 'Test User',
        id: 'test-id',
        template: TemplateNotificacionesEnum.NUEVO_USUARIO,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.template).toBe('nuevoUsuario');
    });
    
  });
});
