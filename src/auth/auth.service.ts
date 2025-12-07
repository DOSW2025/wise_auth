import { Injectable, Logger, BadRequestException, Inject, OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from 'src/prisma/prisma.service';
import { GoogleUserDto } from './dto/google-user.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ServiceBusClient, ServiceBusMessage, ServiceBusSender } from '@azure/service-bus';
import { NotificacionesDto, TemplateNotificacionesEnum } from './dto/notificaciones.dto';

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly logger = new Logger(AuthService.name);
  private readonly CACHE_KEY_STATISTICS = 'estadisticas:usuarios';
  private readonly CACHE_KEY_STATISTICS_ROLES = 'estadisticas:usuarios:roles';
  private readonly CACHE_KEY_REGISTRY = 'usuarios:cache:registry';
  private readonly notification: ServiceBusSender;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly client: ServiceBusClient,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    try {
      this.notification = this.client.createSender('mail.envio.individual');
      this.logger.log('ServiceBus sender inicializado correctamente');
    } catch (error) {
      this.logger.error(`Error al inicializar ServiceBus sender: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async invalidateUserCaches() {
    // Invalidar todos los cachés de estadísticas
    await Promise.all([
      this.cacheManager.del(this.CACHE_KEY_STATISTICS),
      this.cacheManager.del(this.CACHE_KEY_STATISTICS_ROLES),
    ]);

    // Obtener registro de claves de cache de usuarios
    const registry = await this.cacheManager.get<string[]>(this.CACHE_KEY_REGISTRY) || [];

    // Invalidar todas las claves registradas en paralelo
    if (registry.length > 0) {
      await Promise.all(registry.map(key => this.cacheManager.del(key)));
    }

    // Limpiar el registro
    await this.cacheManager.del(this.CACHE_KEY_REGISTRY);
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

        // Verificar si el usuario está suspendido o inactivo
        if (user.estado.nombre === 'suspendido') {
          this.logger.warn(`Intento de login de usuario suspendido: ${user.email}`);
          throw new BadRequestException(
            'Tu cuenta ha sido suspendida. Por favor, contacta al administrador para más información.'
          );
        }

        if (user.estado.nombre === 'inactivo') {
          this.logger.warn(`Intento de login de usuario inactivo: ${user.email}`);
          throw new BadRequestException(
            'Tu cuenta está inactiva. Por favor, contacta al administrador para reactivarla.'
          );
        }

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

        // Invalidar todos los cachés relacionados con usuarios
        await this.invalidateUserCaches();

        const mensaje: NotificacionesDto = {
          email: user.email,
          name: `${user.nombre} ${user.apellido}`,
          template: TemplateNotificacionesEnum.NUEVO_USUARIO,
          resumen: `Bienvenid@ ${user.nombre}, tu cuenta ha sido creada exitosamente.`,
          guardar: true,
        };
        await this.sendNotificacionToServiceBus(mensaje);
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

  async sendNotificacionToServiceBus(notificacionDto: NotificacionesDto) {
    try {
      if (!this.notification) {
        this.logger.error('ServiceBus sender no está inicializado');
        throw new Error('ServiceBus sender no disponible');
      }

      const Message: ServiceBusMessage = {
        body: notificacionDto,
        contentType: 'application/json',
      };

      this.logger.log(`Enviando notificación a Service Bus para: ${notificacionDto.email}`);
      this.logger.debug(`Contenido del mensaje: ${JSON.stringify(notificacionDto)}`);

      await this.notification.sendMessages(Message);

      this.logger.log(`Notificación enviada exitosamente a: ${notificacionDto.email}`);
    } catch (error) {
      this.logger.error(`Error al enviar notificación a Service Bus: ${error.message}`, error.stack);
      this.logger.warn(`La creación del usuario continuó a pesar del error en notificaciones`);
    }
  }

  async onModuleDestroy() {
    try {
      if (this.notification) {
        await this.notification.close();
        this.logger.log('ServiceBus sender cerrado correctamente');
      }
    } catch (error) {
      this.logger.error(`Error al cerrar ServiceBus sender: ${error.message}`, error.stack);
    }
  }
}
