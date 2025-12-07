import { Module, Logger } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { GestionUsuariosModule } from './gestion-usuarios/gestion-usuarios.module';
import { envs } from './config';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const logger = new Logger('CacheModule');

        // Si hay configuración de Redis, usar Redis; si no, usar memoria
        if (envs.redisHost && envs.redisPort && envs.redisPassword) {
          logger.log('Configurando Redis cache...');
          try {
            const store = await redisStore({
              socket: {
                host: envs.redisHost,
                port: envs.redisPort,
                tls: true,
                // Tiempo máximo de espera para conectar (10 segundos)
                connectTimeout: 10000,
                // Mantener la conexión viva enviando pings cada 5 segundos
                keepAlive: 5000,
                // Estrategia de reconexión automática
                reconnectStrategy: (retries) => {
                  if (retries > 10) {
                    logger.error('Demasiados intentos de reconexion a Redis. Fallando...');
                    return new Error('Demasiados intentos de reconexion a Redis');
                  }
                  // Backoff exponencial: 100ms, 200ms, 400ms, 800ms, etc. (máximo 3 segundos)
                  const delay = Math.min(retries * 100, 3000);
                  logger.warn(`Reconectando a Redis en ${delay}ms (intento ${retries}/10)`);
                  return delay;
                },
              },
              password: envs.redisPassword,
              ttl: 300000, // 5 minutos por defecto
            });

            logger.log('Redis cache configurado exitosamente');
            return { store };
          } catch (error) {
            logger.error(`Error al conectar con Redis: ${error.message}`);
            logger.warn('Fallback: usando cache en memoria');
            return {
              ttl: 300000, // 5 minutos
              max: 100, // máximo número de items en cache
            };
          }
        } else {
          logger.log('Usando cache en memoria (Redis no configurado)');
          return {
            ttl: 300000, // 5 minutos
            max: 100, // maximo numero de items en cache
          };
        }
      },
    }),
    AuthModule,
    PrismaModule,
    GestionUsuariosModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
