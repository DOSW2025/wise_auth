import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

  // Configuración de Swagger para documentación de API
  const config = new DocumentBuilder()
    .setTitle('Wise Auth API')
    .setDescription('Microservicio de autenticación y autorización con OAuth 2.0 de Google y JWT')
    .setVersion('1.0')
    .addTag('auth', 'Endpoints de autenticación')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Wise Auth API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  await app.listen(envs.port);
  logger.log(`Auth service running on port ${envs.port}`);
  logger.log(`Swagger documentation available at http://localhost:${envs.port}/api/docs`);
}
mainAuth();
