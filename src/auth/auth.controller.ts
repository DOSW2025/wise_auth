import { Controller, Get, Req, Res, UseGuards, Logger, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleUserDto } from './dto/google-user.dto';
import { envs } from 'src/config';

interface RequestWithGoogleUser extends Request {
  user: GoogleUserDto;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) { }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    this.logger.log('Iniciando flujo de autenticación con Google');
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Req() req: RequestWithGoogleUser,
    @Res() res: Response,
  ): Promise<void> {
    try {
      this.logger.log(`Callback de Google recibido`);

      // Verificar si el usuario existe en la request
      if (!req.user) {
        this.logger.error('No se encontró usuario en la request después del guard');
        const errorUrl = `${envs.frontendurl}/login?error=${encodeURIComponent('No se pudo obtener información del usuario de Google')}`;
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

      // Codificar el usuario para pasarlo por URL
      const userEncoded = encodeURIComponent(JSON.stringify(result.user));
      const redirectUrl = `${envs.frontendurl}/auth/callback?token=${result.access_token}&user=${userEncoded}`;

      this.logger.log(`Redirigiendo a frontend: ${redirectUrl}`);
      res.redirect(HttpStatus.TEMPORARY_REDIRECT, redirectUrl);
    } catch (error) {
      this.logger.error(`Error en callback de Google: ${error.message}`, error.stack);
      const errorUrl = `${envs.frontendurl}/login?error=${encodeURIComponent('Error al procesar autenticación con Google')}`;
      res.redirect(HttpStatus.TEMPORARY_REDIRECT, errorUrl);
    }
  }
}
