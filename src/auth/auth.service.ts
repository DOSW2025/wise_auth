import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { GoogleUserDto } from './dto/google-user.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { DefaultAzureCredential } from '@azure/identity';
import { ServiceBusClient } from '@azure/service-bus';
import { envs } from 'src/config';
import { NotificacionesDto, TemplateNotificacionesEnum } from './dto/notificaciones.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private client: ServiceBusClient;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,

  ) {
    const credential = new DefaultAzureCredential();
    let connectionString = envs.servicebusconnectionstring;
    this.client = new ServiceBusClient(connectionString);
  }

  async validateGoogleUser(googleUserDto: GoogleUserDto): Promise<AuthResponseDto> {
    try {
      this.logger.log(`Validando usuario de Google: ${googleUserDto.email}`);
      this.logger.log(`Google ID: ${googleUserDto.googleId}`);

      let user = await this.prisma.usuario.findFirst({
        where: {
          OR: [{ google_id: googleUserDto.googleId }, { email: googleUserDto.email }],
        },
      });

      if (user) {
        this.logger.log(`Usuario encontrado en BD: ${user.email}, google_id: ${user.google_id}`);

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
          this.logger.log(`Cuenta vinculada exitosamente`);
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
          this.logger.log(`Último login actualizado`);
        }
      } else {
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

        this.logger.log(`Usuario creado exitosamente con ID: ${user.id}`);

        // TODO: mandar informacion a gestion de usuarios para crear perfil completo
        await this.sendNotificacionNuevoUsuario(user.email, `${user.nombre} ${user.apellido}`, user.id);
      }

      const payload = {
        sub: user.id,
        email: user.email,
        role: user.rol,
      };

      this.logger.log(`Generando JWT para usuario: ${user.email}`);
      const token = this.jwtService.sign(payload);
      this.logger.log(`JWT generado exitosamente`);

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
      this.logger.error(`Datos recibidos: ${JSON.stringify(googleUserDto)}`);
      throw new BadRequestException('Error al procesar autenticación con Google');
    }
  }

  private async sendNotificacionNuevoUsuario(email: string, name: string, id: string) {
    try {
      const queueName = 'queue-auth';
      const sender = this.client.createSender(queueName);

      const notificacion: NotificacionesDto = {
        email,
        name,
        id,
        template: TemplateNotificacionesEnum.NUEVO_USUARIO,
      };

      const message = {
        body: notificacion,
      };

      await sender.sendMessages(message);
      await sender.close();

      this.logger.log(`Notificación enviada para nuevo usuario: ${email}`);
    } catch (error) {
      this.logger.error(`Error al enviar notificación: ${error.message}`, error.stack);
    }
  }
}
