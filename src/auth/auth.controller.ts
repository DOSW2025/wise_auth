import { Controller, Get, Req, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleUserDto } from './dto/google-user.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

interface RequestWithGoogleUser extends Request {
  user: GoogleUserDto;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ 
    summary: 'Iniciar autenticación con Google',
    description: 'Redirige al usuario a la página de autenticación de Google OAuth 2.0. El usuario debe autorizar la aplicación y será redirigido al callback.'
  })
  @ApiResponse({ 
    status: 302, 
    description: 'Redirección exitosa a Google OAuth' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Error interno del servidor' 
  })
  async googleAuth() {
    this.logger.log('Iniciando flujo de autenticación con Google');
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ 
    summary: 'Callback de Google OAuth',
    description: 'Endpoint que recibe la respuesta de Google después de la autenticación. Valida el usuario, crea o actualiza sus datos en la base de datos y retorna un token JWT.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Autenticación exitosa. Retorna token JWT y datos del usuario',
    type: AuthResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Error al procesar la autenticación (datos inválidos o incompletos)' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No se pudo obtener el email de la cuenta de Google' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Error interno del servidor' 
  })
  async googleAuthCallback(@Req() req: RequestWithGoogleUser): Promise<AuthResponseDto> {
    this.logger.log(`Callback de Google recibido para usuario: ${req.user?.email}`);

    const googleUserDto = new GoogleUserDto();
    Object.assign(googleUserDto, {
      googleId: req.user.googleId,
      email: req.user.email,
      nombre: req.user.nombre,
      apellido: req.user.apellido,
      avatarUrl: req.user.avatarUrl,
    });

    const result = await this.authService.validateGoogleUser(googleUserDto);

    this.logger.log(`Autenticación exitosa para: ${req.user.email}`);
    return result;
  }
}
