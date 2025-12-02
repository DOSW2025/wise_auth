import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';
import { GoogleUserDto } from './dto/google-user.dto';
import {
  MockServiceBusClient,
  MockDefaultAzureCredential,
} from '../../test/test-mocks';

// Mock de Azure Service Bus
jest.mock('@azure/service-bus', () => ({
  ServiceBusClient: MockServiceBusClient,
}));

// Mock de DefaultAzureCredential
jest.mock('@azure/identity', () => ({
  DefaultAzureCredential: MockDefaultAzureCredential,
}));

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
    const googleUserDto: GoogleUserDto = {
      googleId: 'google-123',
      email: 'test@example.com',
      nombre: 'John',
      apellido: 'Doe',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    const mockUser = {
      id: 'user-uuid-123',
      email: 'test@example.com',
      nombre: 'John',
      apellido: 'Doe',
      google_id: 'google-123',
      avatar_url: 'https://example.com/avatar.jpg',
      rolId: 1,
      estadoId: 1,
      ultimo_login: new Date(),
      password: null,
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date(),
      rol: {
        id: 1,
        nombre: 'estudiante',
      },
      estado: {
        id: 1,
        nombre: 'activo',
      },
    };

    it('should create a new user from Google OAuth when user does not exist', async () => {
      const mockSender = {
        sendMessages: jest.fn(),
        close: jest.fn(),
      };

      // Mock Service Bus createSender
      (service as any).client.createSender = jest.fn().mockReturnValue(mockSender);

      mockPrismaService.usuario.findFirst.mockResolvedValue(null);
      mockPrismaService.usuario.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.validateGoogleUser(googleUserDto);

      expect((prismaService as any).usuario.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { google_id: googleUserDto.googleId },
            { email: googleUserDto.email },
          ],
        },
        include: {
          rol: true,
          estado: true,
        },
      });

      expect((prismaService as any).usuario.create).toHaveBeenCalledWith({
        data: {
          email: googleUserDto.email,
          nombre: googleUserDto.nombre,
          apellido: googleUserDto.apellido,
          google_id: googleUserDto.googleId,
          avatar_url: googleUserDto.avatarUrl,
          rolId: 1,
          estadoId: 1,
          ultimo_login: expect.any(Date),
        },
        include: {
          rol: true,
          estado: true,
        },
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        rol: mockUser.rol.nombre,
      });

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          nombre: mockUser.nombre,
          apellido: mockUser.apellido,
          rol: mockUser.rol.nombre,
          avatarUrl: mockUser.avatar_url,
        },
      });

      // Verify Service Bus notification was sent
      expect(mockSender.sendMessages).toHaveBeenCalledWith({
        body: expect.objectContaining({
          email: mockUser.email,
          name: `${mockUser.nombre} ${mockUser.apellido}`,
          template: 'nuevoUsuario',
          resumen: expect.stringContaining('Bienvenid@'),
          guardar: true,
        }),
      });
      expect(mockSender.close).toHaveBeenCalled();
    });

    it('should link existing user account with Google when user exists but has no google_id', async () => {
      const existingUserWithoutGoogle = {
        ...mockUser,
        google_id: null,
      };

      const updatedUser = {
        ...mockUser,
        google_id: googleUserDto.googleId,
      };

      mockPrismaService.usuario.findFirst.mockResolvedValue(existingUserWithoutGoogle);
      mockPrismaService.usuario.update.mockResolvedValue(updatedUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.validateGoogleUser(googleUserDto);

      expect((prismaService as any).usuario.findFirst).toHaveBeenCalled();

      expect((prismaService as any).usuario.update).toHaveBeenCalledWith({
        where: { id: existingUserWithoutGoogle.id },
        data: {
          google_id: googleUserDto.googleId,
          avatar_url: googleUserDto.avatarUrl,
          estadoId: 1,
          ultimo_login: expect.any(Date),
        },
        include: {
          rol: true,
          estado: true,
        },
      });

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.id).toBe(updatedUser.id);
    });

    it('should update ultimo_login and avatar_url when existing user with google_id logs in', async () => {
      mockPrismaService.usuario.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.usuario.update.mockResolvedValue({
        ...mockUser,
        ultimo_login: new Date(),
      });
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.validateGoogleUser(googleUserDto);

      expect((prismaService as any).usuario.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          ultimo_login: expect.any(Date),
          avatar_url: googleUserDto.avatarUrl,
        },
        include: {
          rol: true,
          estado: true,
        },
      });

      expect(result.access_token).toBe('mock-jwt-token');
    });

    it('should generate a valid JWT token with correct payload', async () => {
      mockPrismaService.usuario.findFirst.mockResolvedValue(null);

      const mockSender = {
        sendMessages: jest.fn(),
        close: jest.fn(),
      };
      (service as any).client.createSender = jest.fn().mockReturnValue(mockSender);

      mockPrismaService.usuario.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      await service.validateGoogleUser(googleUserDto);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        rol: mockUser.rol.nombre,
      });
    });

    it('should throw BadRequestException when prisma findFirst fails', async () => {
      mockPrismaService.usuario.findFirst.mockRejectedValue(
        new Error('Database connection error'),
      );

      await expect(service.validateGoogleUser(googleUserDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateGoogleUser(googleUserDto)).rejects.toThrow(
        'Error al procesar autenticación con Google',
      );
    });

    it('should throw BadRequestException when prisma create fails', async () => {
      mockPrismaService.usuario.findFirst.mockResolvedValue(null);
      mockPrismaService.usuario.create.mockRejectedValue(
        new Error('Failed to create user'),
      );

      await expect(service.validateGoogleUser(googleUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when prisma update fails', async () => {
      const existingUser = { ...mockUser, google_id: null };
      mockPrismaService.usuario.findFirst.mockResolvedValue(existingUser);
      mockPrismaService.usuario.update.mockRejectedValue(
        new Error('Failed to update user'),
      );

      await expect(service.validateGoogleUser(googleUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle user with missing avatarUrl', async () => {
      const googleUserDtoWithoutAvatar: GoogleUserDto = {
        ...googleUserDto,
        avatarUrl: undefined,
      };

      const mockSender = {
        sendMessages: jest.fn(),
        close: jest.fn(),
      };
      (service as any).client.createSender = jest.fn().mockReturnValue(mockSender);

      mockPrismaService.usuario.findFirst.mockResolvedValue(null);
      mockPrismaService.usuario.create.mockResolvedValue({
        ...mockUser,
        avatar_url: null,
      });
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.validateGoogleUser(googleUserDtoWithoutAvatar);

      expect((prismaService as any).usuario.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          avatar_url: undefined,
        }),
        include: {
          rol: true,
          estado: true,
        },
      });

      expect(result.user.avatarUrl).toBeNull();
    });

    it('should find user by google_id when it exists', async () => {
      const userWithGoogleId = { ...mockUser };
      mockPrismaService.usuario.findFirst.mockResolvedValue(userWithGoogleId);
      mockPrismaService.usuario.update.mockResolvedValue(userWithGoogleId);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      await service.validateGoogleUser(googleUserDto);

      expect((prismaService as any).usuario.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { google_id: googleUserDto.googleId },
            { email: googleUserDto.email },
          ],
        },
        include: {
          rol: true,
          estado: true,
        },
      });
    });

    it('should find user by email when google_id does not match but email does', async () => {
      const userFoundByEmail = { ...mockUser, google_id: null };
      mockPrismaService.usuario.findFirst.mockResolvedValue(userFoundByEmail);
      mockPrismaService.usuario.update.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      await service.validateGoogleUser(googleUserDto);

      expect((prismaService as any).usuario.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { google_id: googleUserDto.googleId },
            { email: googleUserDto.email },
          ],
        },
        include: {
          rol: true,
          estado: true,
        },
      });
    });

    it('should handle Service Bus notification error gracefully', async () => {
      const mockSender = {
        sendMessages: jest.fn().mockRejectedValue(new Error('Service Bus error')),
        close: jest.fn(),
      };
      (service as any).client.createSender = jest.fn().mockReturnValue(mockSender);

      mockPrismaService.usuario.findFirst.mockResolvedValue(null);
      mockPrismaService.usuario.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      // Should not throw even if notification fails
      const result = await service.validateGoogleUser(googleUserDto);

      expect(result).toBeDefined();
      expect(result.access_token).toBe('mock-jwt-token');
    });

    it('should not send notification when user already exists', async () => {
      const mockSender = {
        sendMessages: jest.fn(),
        close: jest.fn(),
      };
      (service as any).client.createSender = jest.fn().mockReturnValue(mockSender);

      mockPrismaService.usuario.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.usuario.update.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      await service.validateGoogleUser(googleUserDto);

      // Notification should not be sent for existing users
      expect(mockSender.sendMessages).not.toHaveBeenCalled();
    });
  });
});
