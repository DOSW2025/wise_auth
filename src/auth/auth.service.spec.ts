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
    const googleUserDto: GoogleUserDto = {
      googleId: 'google-123',
      email: 'test@example.com',
      nombre: 'John',
      apellido: 'Doe',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      nombre: 'John',
      apellido: 'Doe',
      google_id: 'google-123',
      avatar_url: 'https://example.com/avatar.jpg',
      email_verificado: true,
      estado: 'activo',
      rol: 'estudiante',
      ultimo_login: new Date(),
      password: null,
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date(),
    };

    it('should create a new user from Google OAuth when user does not exist', async () => {
      mockPrismaService.usuario.findFirst.mockResolvedValue(null);
      mockPrismaService.usuario.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.validateGoogleUser(googleUserDto);

      expect(prismaService.usuario.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { google_id: googleUserDto.googleId },
            { email: googleUserDto.email },
          ],
        },
      });

      expect(prismaService.usuario.create).toHaveBeenCalledWith({
        data: {
          email: googleUserDto.email,
          nombre: googleUserDto.nombre,
          apellido: googleUserDto.apellido,
          google_id: googleUserDto.googleId,
          avatar_url: googleUserDto.avatarUrl,
          email_verificado: true,
          estado: 'activo',
          rol: 'estudiante',
          ultimo_login: expect.any(Date),
        },
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.rol,
      });

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          nombre: mockUser.nombre,
          apellido: mockUser.apellido,
          rol: mockUser.rol,
          avatarUrl: mockUser.avatar_url,
        },
      });
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

      expect(prismaService.usuario.findFirst).toHaveBeenCalled();

      expect(prismaService.usuario.update).toHaveBeenCalledWith({
        where: { id: existingUserWithoutGoogle.id },
        data: {
          google_id: googleUserDto.googleId,
          avatar_url: googleUserDto.avatarUrl,
          email_verificado: true,
          estado: 'activo',
          ultimo_login: expect.any(Date),
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

      expect(prismaService.usuario.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          ultimo_login: expect.any(Date),
          avatar_url: googleUserDto.avatarUrl,
        },
      });

      expect(result.access_token).toBe('mock-jwt-token');
    });

    it('should generate a valid JWT token with correct payload', async () => {
      mockPrismaService.usuario.findFirst.mockResolvedValue(null);
      mockPrismaService.usuario.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      await service.validateGoogleUser(googleUserDto);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.rol,
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

      mockPrismaService.usuario.findFirst.mockResolvedValue(null);
      mockPrismaService.usuario.create.mockResolvedValue({
        ...mockUser,
        avatar_url: null,
      });
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.validateGoogleUser(googleUserDtoWithoutAvatar);

      expect(prismaService.usuario.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          avatar_url: undefined,
        }),
      });

      expect(result.user.avatarUrl).toBeNull();
    });

    it('should find user by google_id when it exists', async () => {
      const userWithGoogleId = { ...mockUser };
      mockPrismaService.usuario.findFirst.mockResolvedValue(userWithGoogleId);
      mockPrismaService.usuario.update.mockResolvedValue(userWithGoogleId);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      await service.validateGoogleUser(googleUserDto);

      expect(prismaService.usuario.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { google_id: googleUserDto.googleId },
            { email: googleUserDto.email },
          ],
        },
      });
    });

    it('should find user by email when google_id does not match but email does', async () => {
      const userFoundByEmail = { ...mockUser, google_id: null };
      mockPrismaService.usuario.findFirst.mockResolvedValue(userFoundByEmail);
      mockPrismaService.usuario.update.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      await service.validateGoogleUser(googleUserDto);

      expect(prismaService.usuario.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { google_id: googleUserDto.googleId },
            { email: googleUserDto.email },
          ],
        },
      });
    });
  });
});
