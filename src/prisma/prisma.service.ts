import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// Importamos desde @prisma/client (ubicación por defecto en node_modules)
// Antes usábamos '../../generated/prisma' pero causaba problemas con la compilación de NestJS
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit,OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
  
}
