import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { GoogleUserDto } from './dto/google-user.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateGoogleUser(googleUserDto: GoogleUserDto): Promise<AuthResponseDto> {
    try {
      this.logger.log(`Validando usuario de Google: ${googleUserDto.email}`);

      let user = await this.prisma.usuario.findFirst({
        where: {
          OR: [{ google_id: googleUserDto.googleId }, { email: googleUserDto.email }],
        },
      });

      if (user) {
        if (!user.google_id) {
          this.logger.log(`Vinculando cuenta existente con Google: ${googleUserDto.email}`);
          user = await this.prisma.usuario.update({
            where: { id: user.id },
            data: {
              google_id: googleUserDto.googleId,
              avatar_url: googleUserDto.avatarUrl,
              email_verificado: true,
              estado: 'activo',
              ultimo_login: new Date(),
            },
          });
        } else {
          // Actualizar último login y avatar
          this.logger.log(`Usuario existente iniciando sesión: ${googleUserDto.email}`);
          user = await this.prisma.usuario.update({
            where: { id: user.id },
            data: {
              ultimo_login: new Date(),
              avatar_url: googleUserDto.avatarUrl,
            },
          });
        }
      } else {
        // Crear nuevo usuario
        this.logger.log(`Creando nuevo usuario desde Google: ${googleUserDto.email}`);
        user = await this.prisma.usuario.create({
          data: {
            email: googleUserDto.email,
            nombre: googleUserDto.nombre,
            apellido: googleUserDto.apellido,
            google_id: googleUserDto.googleId,
            avatar_url: googleUserDto.avatarUrl,
            email_verificado: true,
            estado: 'activo',
            rol: 'estudiante',
            ultimo_login: new Date(),
          },
        });
      }

      const payload = {
        sub: user.id,
        email: user.email,
        role: user.rol,
      };

      const token = this.jwtService.sign(payload);

      this.logger.log(`Login exitoso para usuario: ${user.email}`);

      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          rol: user.rol,
          avatarUrl: user.avatar_url,
        },
      };
    } catch (error) {
      this.logger.error(`Error en validateGoogleUser: ${error.message}`, error.stack);
      throw new BadRequestException('Error al procesar autenticación con Google');
    }
  }
}
