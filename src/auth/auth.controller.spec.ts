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
      id: '9b1deb3d-3b7d-4bad-9bdd-2b0d70cf0d28',
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
      it('should log the start of Google auth flow', async () => {
        const loggerSpy = jest.spyOn(controller['logger'], 'log');

        await controller.googleAuth();

        expect(loggerSpy).toHaveBeenCalledWith(
          'Iniciando flujo de autenticación con Google'
        );
      });
    });

    describe('googleAuthCallback', () => {
      it('should redirect to frontend with token when authentication is successful', async () => {
        const mockReq: any = {
          user: mockGoogleUserDto,
        };
        const mockRes: any = {
          redirect: jest.fn(),
        };

        mockAuthService.validateGoogleUser.mockResolvedValue(mockAuthResponse);

        await controller.googleAuthCallback(mockReq, mockRes);

        expect(authService.validateGoogleUser).toHaveBeenCalled();
        expect(mockRes.redirect).toHaveBeenCalledWith(
          307,
          expect.stringContaining('/auth/callback?token=')
        );
      });

      it('should redirect to error page when user is not in request', async () => {
        const mockReq: any = {
          user: null,
        };
        const mockRes: any = {
          redirect: jest.fn(),
        };

        await controller.googleAuthCallback(mockReq, mockRes);

        expect(mockRes.redirect).toHaveBeenCalledWith(
          307,
          expect.stringContaining('/login?error=')
        );
        expect(authService.validateGoogleUser).not.toHaveBeenCalled();
      });

      it('should redirect to error page when validation fails', async () => {
        const mockReq: any = {
          user: mockGoogleUserDto,
        };
        const mockRes: any = {
          redirect: jest.fn(),
        };

        mockAuthService.validateGoogleUser.mockRejectedValue(
          new Error('Validation failed')
        );

        await controller.googleAuthCallback(mockReq, mockRes);

        expect(mockRes.redirect).toHaveBeenCalledWith(
          307,
          expect.stringContaining('/login?error=')
        );
      });

      it('should log errors appropriately', async () => {
        const mockReq: any = {
          user: mockGoogleUserDto,
        };
        const mockRes: any = {
          redirect: jest.fn(),
        };
        const loggerErrorSpy = jest.spyOn(controller['logger'], 'error');

        mockAuthService.validateGoogleUser.mockRejectedValue(
          new Error('Test error')
        );

        await controller.googleAuthCallback(mockReq, mockRes);

        expect(loggerErrorSpy).toHaveBeenCalled();
      });
    });
  });
