import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { GestionUsuariosModule } from './gestion-usuarios/gestion-usuarios.module';

@Module({
  imports: [AuthModule, PrismaModule, GestionUsuariosModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
