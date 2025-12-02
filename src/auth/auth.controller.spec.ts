import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleUserDto } from './dto/google-user.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { HttpStatus } from '@nestjs/common';

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
      id: 'user-uuid-123',
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
    let mockRequest: any;
    let mockResponse: any;

    beforeEach(() => {
      mockRequest = {
        user: mockGoogleUserDto,
      };

      mockResponse = {
        redirect: jest.fn(),
      };
    });

    it('should process Google callback and redirect with token', async () => {
      mockAuthService.validateGoogleUser.mockResolvedValue(mockAuthResponse);

      await controller.googleAuthCallback(mockRequest, mockResponse);

      expect(authService.validateGoogleUser).toHaveBeenCalledWith(
        expect.objectContaining({
          googleId: mockGoogleUserDto.googleId,
          email: mockGoogleUserDto.email,
          nombre: mockGoogleUserDto.nombre,
          apellido: mockGoogleUserDto.apellido,
          avatarUrl: mockGoogleUserDto.avatarUrl,
        }),
      );

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        HttpStatus.TEMPORARY_REDIRECT,
        expect.stringContaining('token=mock-jwt-token'),
      );

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        HttpStatus.TEMPORARY_REDIRECT,
        expect.stringContaining('user='),
      );
    });

    it('should redirect to error page when user is not in request', async () => {
      const requestWithoutUser = {};

      await controller.googleAuthCallback(requestWithoutUser as any, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        HttpStatus.TEMPORARY_REDIRECT,
        expect.stringContaining('error='),
      );

      expect(authService.validateGoogleUser).not.toHaveBeenCalled();
    });

    it('should redirect to error page when authentication fails', async () => {
      mockAuthService.validateGoogleUser.mockRejectedValue(
        new Error('Authentication failed'),
      );

      await controller.googleAuthCallback(mockRequest, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        HttpStatus.TEMPORARY_REDIRECT,
        expect.stringContaining('error='),
      );
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

      await controller.googleAuthCallback(requestWithoutAvatar, mockResponse);

      expect(authService.validateGoogleUser).toHaveBeenCalledWith(
        expect.objectContaining({
          avatarUrl: undefined,
        }),
      );

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        HttpStatus.TEMPORARY_REDIRECT,
        expect.stringContaining('token='),
      );
    });

    it('should have @Public decorator', () => {
      const metadata = Reflect.getMetadata('isPublic', controller.googleAuthCallback);
      expect(metadata).toBe(true);
    });

    it('should redirect with properly formatted URL', async () => {
      mockAuthService.validateGoogleUser.mockResolvedValue(mockAuthResponse);

      await controller.googleAuthCallback(mockRequest, mockResponse);

      const redirectUrl = mockResponse.redirect.mock.calls[0][1];

      // Should be a valid URL
      expect(() => new URL(redirectUrl)).not.toThrow();

      // Should contain required parameters
      expect(redirectUrl).toContain('token=');
      expect(redirectUrl).toContain('user=');
    });

    it('should encode user data properly in redirect URL', async () => {
      mockAuthService.validateGoogleUser.mockResolvedValue(mockAuthResponse);

      await controller.googleAuthCallback(mockRequest, mockResponse);

      const redirectUrl = mockResponse.redirect.mock.calls[0][1];
      const url = new URL(redirectUrl);
      const userParam = url.searchParams.get('user');

      expect(userParam).toBeDefined();

      // Should be valid JSON
      expect(() => JSON.parse(userParam!)).not.toThrow();

      const userData = JSON.parse(userParam!);
      expect(userData.email).toBe(mockAuthResponse.user.email);
      expect(userData.nombre).toBe(mockAuthResponse.user.nombre);
    });

    it('should redirect to gateway URL', async () => {
      mockAuthService.validateGoogleUser.mockResolvedValue(mockAuthResponse);

      await controller.googleAuthCallback(mockRequest, mockResponse);

      const redirectUrl = mockResponse.redirect.mock.calls[0][1];

      // Should redirect to gateway with /wise prefix
      expect(redirectUrl).toContain('/wise/auth/callback');
    });

    it('should handle different user roles in redirect', async () => {
      const tutorResponse = {
        ...mockAuthResponse,
        user: {
          ...mockAuthResponse.user,
          rol: 'tutor',
        },
      };

      mockAuthService.validateGoogleUser.mockResolvedValue(tutorResponse);

      await controller.googleAuthCallback(mockRequest, mockResponse);

      const redirectUrl = mockResponse.redirect.mock.calls[0][1];
      const url = new URL(redirectUrl);
      const userParam = url.searchParams.get('user');
      const userData = JSON.parse(userParam!);

      expect(userData.rol).toBe('tutor');
    });

    it('should redirect with error when validateGoogleUser throws BadRequestException', async () => {
      const error = new Error('Error al procesar autenticación con Google');
      mockAuthService.validateGoogleUser.mockRejectedValue(error);

      await controller.googleAuthCallback(mockRequest, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        HttpStatus.TEMPORARY_REDIRECT,
        expect.stringContaining('error='),
      );

      const redirectUrl = mockResponse.redirect.mock.calls[0][1];
      const url = new URL(redirectUrl);
      const errorParam = url.searchParams.get('error');
      expect(errorParam).toBe('Error al procesar autenticación con Google');
    });

    it('should use TEMPORARY_REDIRECT status code', async () => {
      mockAuthService.validateGoogleUser.mockResolvedValue(mockAuthResponse);

      await controller.googleAuthCallback(mockRequest, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        HttpStatus.TEMPORARY_REDIRECT,
        expect.any(String),
      );
    });

    it('should handle gateway URL with existing /wise path', async () => {
      mockAuthService.validateGoogleUser.mockResolvedValue(mockAuthResponse);

      await controller.googleAuthCallback(mockRequest, mockResponse);

      const redirectUrl = mockResponse.redirect.mock.calls[0][1];

      // Should contain /wise/auth/callback, not /wise/wise/auth/callback
      expect(redirectUrl).toMatch(/\/wise\/auth\/callback/);
      expect(redirectUrl).not.toMatch(/\/wise\/wise/);
    });
  });
});
