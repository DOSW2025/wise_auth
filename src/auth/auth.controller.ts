import { Controller, Get, Req, UseGuards, Logger } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleUserDto } from './dto/google-user.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

interface RequestWithGoogleUser extends Request {
  user: GoogleUserDto;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    this.logger.log('Iniciando flujo de autenticación con Google');
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
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
