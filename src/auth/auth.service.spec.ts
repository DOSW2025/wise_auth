import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';
import { GoogleUserDto } from './dto/google-user.dto';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    usuario: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateGoogleUser', () => {
    const mockGoogleUser: GoogleUserDto = {
      googleId: 'google-123',
      email: 'test@example.com',
      nombre: 'John',
      apellido: 'Doe',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    it('should create new user when user does not exist', async () => {
      const mockCreatedUser = {
        id: '123',
        email: mockGoogleUser.email,
        nombre: mockGoogleUser.nombre,
        apellido: mockGoogleUser.apellido,
        google_id: mockGoogleUser.googleId,
        avatar_url: mockGoogleUser.avatarUrl,
        rol: 'estudiante',
        estado: 'activo',
        email_verificado: true,
        ultimo_login: expect.any(Date),
      };

      mockPrismaService.usuario.findFirst.mockResolvedValue(null);
      mockPrismaService.usuario.create.mockResolvedValue(mockCreatedUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.validateGoogleUser(mockGoogleUser);

      expect(prismaService.usuario.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { google_id: mockGoogleUser.googleId },
            { email: mockGoogleUser.email },
          ],
        },
      });
      expect(prismaService.usuario.create).toHaveBeenCalled();
      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.email).toBe(mockGoogleUser.email);
    });

    it('should update existing user with google_id when linking account', async () => {
      const existingUser = {
        id: '123',
        email: mockGoogleUser.email,
        nombre: 'John',
        apellido: 'Doe',
        google_id: null,
        avatar_url: null,
        rol: 'estudiante',
        estado: 'activo',
      };

      const updatedUser = {
        ...existingUser,
        google_id: mockGoogleUser.googleId,
        avatar_url: mockGoogleUser.avatarUrl,
        email_verificado: true,
        ultimo_login: expect.any(Date),
      };

      mockPrismaService.usuario.findFirst.mockResolvedValue(existingUser);
      mockPrismaService.usuario.update.mockResolvedValue(updatedUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.validateGoogleUser(mockGoogleUser);

      expect(prismaService.usuario.update).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        data: expect.objectContaining({
          google_id: mockGoogleUser.googleId,
          avatar_url: mockGoogleUser.avatarUrl,
          email_verificado: true,
          estado: 'activo',
        }),
      });
      expect(result.access_token).toBe('mock-jwt-token');
    });

    it('should update last login for existing Google user', async () => {
      const existingUser = {
        id: '123',
        email: mockGoogleUser.email,
        nombre: 'John',
        apellido: 'Doe',
        google_id: mockGoogleUser.googleId,
        avatar_url: 'old-avatar.jpg',
        rol: 'estudiante',
        estado: 'activo',
      };

      mockPrismaService.usuario.findFirst.mockResolvedValue(existingUser);
      mockPrismaService.usuario.update.mockResolvedValue(existingUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      await service.validateGoogleUser(mockGoogleUser);

      expect(prismaService.usuario.update).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        data: expect.objectContaining({
          ultimo_login: expect.any(Date),
          avatar_url: mockGoogleUser.avatarUrl,
        }),
      });
    });

    it('should generate JWT token with correct payload', async () => {
      const mockUser = {
        id: '123',
        email: mockGoogleUser.email,
        nombre: mockGoogleUser.nombre,
        apellido: mockGoogleUser.apellido,
        google_id: mockGoogleUser.googleId,
        avatar_url: mockGoogleUser.avatarUrl,
        rol: 'estudiante',
      };

      mockPrismaService.usuario.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.usuario.update.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      await service.validateGoogleUser(mockGoogleUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        rol: mockUser.rol,
      });
    });

    it('should throw BadRequestException on error', async () => {
      mockPrismaService.usuario.findFirst.mockRejectedValue(
        new Error('Database error')
      );

      await expect(service.validateGoogleUser(mockGoogleUser)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.validateGoogleUser(mockGoogleUser)).rejects.toThrow(
        'Error al procesar autenticación con Google'
      );
    });

    it('should log errors with user data', async () => {
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');
      mockPrismaService.usuario.findFirst.mockRejectedValue(
        new Error('Database error')
      );

      try {
        await service.validateGoogleUser(mockGoogleUser);
      } catch (error) {
        // Expected error
      }

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error en validateGoogleUser'),
        expect.any(String)
      );
    });
  });
});