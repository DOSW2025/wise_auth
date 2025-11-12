import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

async function mainAuth() {
  const logger = new Logger('Main Auth');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  //Esto es para activar los filtros o DTOS en el proyecto
  //sin esto, Nest por defecto no los tomará
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Aplicar guards globalmente (aqí dejo la explicación de qué es flujo)
  const reflector = app.get(Reflector);
  app.useGlobalGuards(
    new JwtAuthGuard(reflector), // Primero valida el JWT
    new RolesGuard(reflector),   // Luego valida los roles
  );

  await app.listen(envs.port);
  logger.log(`Auth service running on port ${envs.port}`);
}
mainAuth();
