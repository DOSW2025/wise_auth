import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Controller, Get, Req, Res, UseGuards, Logger, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleUserDto } from './dto/google-user.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { envs } from 'src/config';

interface RequestWithGoogleUser extends Request {
  user: GoogleUserDto;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) { }

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
  async googleAuthCallback(
    @Req() req: RequestWithGoogleUser,
    @Res() res: Response,
  ): Promise<void> {
    try {
      this.logger.log(`Callback de Google recibido`);

      // Verificar si el usuario existe en la request
      if (!req.user) {
        this.logger.error('No se encontró usuario en la request después del guard');
        const errorUrl = `${envs.gatewayUrl}/auth/callback?error=${encodeURIComponent('No se pudo obtener información del usuario de Google')}`;
        res.redirect(HttpStatus.TEMPORARY_REDIRECT, errorUrl);
        return;
      }

      this.logger.log(`Usuario de Google: ${req.user.email}`);

      const googleUserDto = new GoogleUserDto();
      Object.assign(googleUserDto, {
        googleId: req.user.googleId,
        email: req.user.email,
        nombre: req.user.nombre,
        apellido: req.user.apellido,
        avatarUrl: req.user.avatarUrl,
      });

      this.logger.log(`Validando usuario con el servicio de autenticación`);
      const result = await this.authService.validateGoogleUser(googleUserDto);

      this.logger.log(`Autenticación exitosa para: ${req.user.email}`);

      const url = new URL(envs.gatewayUrl);
      const basePath = url.pathname.replace(/\/$/, '');
      url.pathname = `${basePath}/auth/callback`;
      url.searchParams.append('token', result.access_token);
      url.searchParams.append('user', JSON.stringify(result.user));

      const redirectUrl = url.toString();

      this.logger.log(`Redirigiendo a gateway: ${redirectUrl}`);
      res.redirect(HttpStatus.TEMPORARY_REDIRECT, redirectUrl);
    } catch (error) {
      this.logger.error(`Error en callback de Google: ${error.message}`, error.stack);

      const url = new URL(envs.gatewayUrl);
      const basePath = url.pathname.replace(/\/$/, '');
      url.pathname = `${basePath}/auth/callback`;
      url.searchParams.append('error', 'Error al procesar autenticación con Google');

      res.redirect(HttpStatus.TEMPORARY_REDIRECT, url.toString());
    }
  }
}
