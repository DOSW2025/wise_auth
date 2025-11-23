import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleUserDto } from './dto/google-user.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    validateGoogleUser: jest.fn(),
  };

  const mockGoogleUserDto: GoogleUserDto = {
    googleId: 'google-123',
    email: 'test@example.com',
    nombre: 'John',
    apellido: 'Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  const mockAuthResponse: AuthResponseDto = {
    access_token: 'mock-jwt-token',
    user: {
      id: 1,
      email: 'test@example.com',
      nombre: 'John',
      apellido: 'Doe',
      rol: 'estudiante',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleAuth', () => {
    it('should initiate Google authentication flow', async () => {
      const result = await controller.googleAuth();

      // This endpoint just initiates the flow, it doesn't return anything
      expect(result).toBeUndefined();
    });

    it('should have @Public decorator', () => {
      const metadata = Reflect.getMetadata('isPublic', controller.googleAuth);
      expect(metadata).toBe(true);
    });
  });

  describe('googleAuthCallback', () => {
    const mockRequest = {
      user: mockGoogleUserDto,
    } as any;

    it('should process Google callback and return auth response', async () => {
      mockAuthService.validateGoogleUser.mockResolvedValue(mockAuthResponse);

      const result = await controller.googleAuthCallback(mockRequest);

      expect(authService.validateGoogleUser).toHaveBeenCalledWith(
        expect.objectContaining({
          googleId: mockGoogleUserDto.googleId,
          email: mockGoogleUserDto.email,
          nombre: mockGoogleUserDto.nombre,
          apellido: mockGoogleUserDto.apellido,
          avatarUrl: mockGoogleUserDto.avatarUrl,
        }),
      );

      expect(result).toEqual(mockAuthResponse);
      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should handle user without avatarUrl', async () => {
      const requestWithoutAvatar = {
        user: {
          ...mockGoogleUserDto,
          avatarUrl: undefined,
        },
      } as any;

      const responseWithoutAvatar = {
        ...mockAuthResponse,
        user: {
          ...mockAuthResponse.user,
          avatarUrl: null,
        },
      };

      mockAuthService.validateGoogleUser.mockResolvedValue(responseWithoutAvatar);

      const result = await controller.googleAuthCallback(requestWithoutAvatar);

      expect(authService.validateGoogleUser).toHaveBeenCalledWith(
        expect.objectContaining({
          googleId: mockGoogleUserDto.googleId,
          email: mockGoogleUserDto.email,
          nombre: mockGoogleUserDto.nombre,
          apellido: mockGoogleUserDto.apellido,
          avatarUrl: undefined,
        }),
      );

      expect(result.user.avatarUrl).toBeNull();
    });

    it('should have @Public decorator', () => {
      const metadata = Reflect.getMetadata('isPublic', controller.googleAuthCallback);
      expect(metadata).toBe(true);
    });

    it('should create GoogleUserDto with correct data from request', async () => {
      mockAuthService.validateGoogleUser.mockResolvedValue(mockAuthResponse);

      await controller.googleAuthCallback(mockRequest);

      expect(authService.validateGoogleUser).toHaveBeenCalledWith(
        expect.objectContaining({
          googleId: 'google-123',
          email: 'test@example.com',
          nombre: 'John',
          apellido: 'Doe',
          avatarUrl: 'https://example.com/avatar.jpg',
        }),
      );
    });

    it('should propagate errors from AuthService', async () => {
      const error = new Error('Authentication failed');
      mockAuthService.validateGoogleUser.mockRejectedValue(error);

      await expect(controller.googleAuthCallback(mockRequest)).rejects.toThrow(
        'Authentication failed',
      );
    });

    it('should handle different user roles correctly', async () => {
      const tutorResponse = {
        ...mockAuthResponse,
        user: {
          ...mockAuthResponse.user,
          rol: 'tutor',
        },
      };

      mockAuthService.validateGoogleUser.mockResolvedValue(tutorResponse);

      const result = await controller.googleAuthCallback(mockRequest);

      expect(result.user.rol).toBe('tutor');
    });

    it('should return valid access_token', async () => {
      mockAuthService.validateGoogleUser.mockResolvedValue(mockAuthResponse);

      const result = await controller.googleAuthCallback(mockRequest);

      expect(result.access_token).toBeDefined();
      expect(typeof result.access_token).toBe('string');
      expect(result.access_token.length).toBeGreaterThan(0);
    });
  });
});
