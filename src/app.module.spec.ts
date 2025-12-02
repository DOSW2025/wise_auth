import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { GestionUsuariosModule } from './gestion-usuarios/gestion-usuarios.module';
import { PrismaModule } from './prisma/prisma.module';

// Mock the envs module
jest.mock('./config', () => ({
  envs: {
    port: 3001,
    jwtSecret: 'test-secret',
    jwtExpiration: '1h',
    googleClientId: 'test-client-id',
    googleClientSecret: 'test-secret',
    googleCallbackUrl: 'http://localhost:3001/auth/google/callback',
    databaseUrl: 'postgresql://test:test@localhost:5432/test',
    directUrl: 'postgresql://test:test@localhost:5432/test',
    servicebusconnectionstring: 'test-connection-string',
  },
}));

// Mock Azure Service Bus
jest.mock('@azure/service-bus', () => ({
  ServiceBusClient: jest.fn().mockImplementation(() => ({
    createSender: jest.fn().mockReturnValue({
      sendMessages: jest.fn(),
      close: jest.fn(),
    }),
    close: jest.fn(),
  })),
}));

// Mock DefaultAzureCredential
jest.mock('@azure/identity', () => ({
  DefaultAzureCredential: jest.fn(),
}));

describe('AppModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should import PrismaModule', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const prismaModule = module.get(PrismaModule);
    expect(prismaModule).toBeDefined();
  });

  it('should import AuthModule', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const authModule = module.get(AuthModule);
    expect(authModule).toBeDefined();
  });

  it('should import GestionUsuariosModule', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const gestionModule = module.get(GestionUsuariosModule);
    expect(gestionModule).toBeDefined();
  });

  it('should be a valid NestJS module', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await module.init();
    expect(module).toBeDefined();
    await module.close();
  });
});
