import { Module } from '@nestjs/common';
import { GestionUsuariosService } from './gestion-usuarios.service';
import { GestionUsuariosController } from './gestion-usuarios.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [GestionUsuariosController],
  providers: [GestionUsuariosService, PrismaService],
})
export class GestionUsuariosModule {}
