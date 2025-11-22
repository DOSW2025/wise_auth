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

      // Buscamos el usuario por google_id o email, incluyendo las relaciones de rol y estado
      // Esto es necesario porque ahora rol y estado son tablas separadas, no enums
      let user = await this.prisma.usuario.findFirst({
        where: {
          OR: [{ google_id: googleUserDto.googleId }, { email: googleUserDto.email }],
        },
        include: {
          rol: true,    // Incluimos la relación para obtener el nombre del rol
          estado: true, // Incluimos la relación para obtener el nombre del estado
        },
      });

      if (user) {
        this.logger.log(`Usuario encontrado en BD: ${user.email}, google_id: ${user.google_id}`);

        if (!user.google_id) {
          // Usuario existe pero no tiene Google vinculado, lo vinculamos
          this.logger.log(`Vinculando cuenta existente con Google: ${googleUserDto.email}`);
          user = await this.prisma.usuario.update({
            where: { id: user.id },
            data: {
              google_id: googleUserDto.googleId,
              avatar_url: googleUserDto.avatarUrl,
              // estadoId: 1 corresponde a 'activo' en nuestra tabla estados_usuario
              estadoId: 1,
              ultimo_login: new Date(),
            },
            include: {
              rol: true,
              estado: true,
            },
          });
          this.logger.log(`Cuenta vinculada exitosamente`);
        } else {
          // Usuario ya existe y tiene Google, solo actualizamos último login y avatar
          this.logger.log(`Usuario existente iniciando sesión: ${googleUserDto.email}`);
          user = await this.prisma.usuario.update({
            where: { id: user.id },
            data: {
              ultimo_login: new Date(),
              avatar_url: googleUserDto.avatarUrl,
            },
            include: {
              rol: true,
              estado: true,
            },
          });
          this.logger.log(`Último login actualizado`);
        }
      } else {
        // Nuevo usuario desde Google, lo creamos con valores por defecto
        this.logger.log(`Creando nuevo usuario desde Google: ${googleUserDto.email}`);

        user = await this.prisma.usuario.create({
          data: {
            email: googleUserDto.email,
            nombre: googleUserDto.nombre,
            apellido: googleUserDto.apellido,
            google_id: googleUserDto.googleId,
            avatar_url: googleUserDto.avatarUrl,
            // rolId: 1 corresponde a 'estudiante' en nuestra tabla roles
            // estadoId: 1 corresponde a 'activo' en nuestra tabla estados_usuario
            // Estos son los valores por defecto definidos en el schema de Prisma
            rolId: 1,
            estadoId: 1,
            ultimo_login: new Date(),
          },
          include: {
            rol: true,
            estado: true,
          },
        });

        // Enviar notificación de nuevo usuario al bus de mensajes
        await this.sendNotificacionNuevoUsuario(user.email, `${user.nombre} ${user.apellido}`, user.id);
      }

      // Construimos el payload del JWT
      // Usamos user.rol.nombre para obtener el string del rol ('estudiante', 'tutor', 'admin')
      // Esto es importante porque el guard de roles compara strings en minúsculas
      const payload = {
        sub: user.id,
        email: user.email,
        rol: user.rol.nombre, // Ahora es el nombre del rol desde la tabla relacionada
      };

      this.logger.log(`Generando JWT para usuario: ${user.email}`);
      const token = this.jwtService.sign(payload);
      this.logger.log(`JWT generado exitosamente`);

      this.logger.log(`Login exitoso para usuario: ${user.email}`);

      // Retornamos la respuesta con el token y datos del usuario
      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          rol: user.rol.nombre,
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
      const queueName = 'mail.envio.individual';
      const sender = this.client.createSender(queueName);

      const notificacion: NotificacionesDto = {
        email,
        name,
        template: TemplateNotificacionesEnum.NUEVO_USUARIO,
        resumen: `Bienvenid@ ${name}, tu cuenta ha sido creada exitosamente.`,
        guardar: true,
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
