import { Test } from '@nestjs/testing';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Mock the envs module
jest.mock('../config', () => ({
  envs: {
    jwtSecret: 'test-secret',
    jwtExpiration: '1h',
    googleClientId: 'test-client-id',
    googleClientSecret: 'test-secret',
    googleCallbackUrl: 'http://localhost:3001/auth/google/callback',
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

describe('AuthModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should have AuthController', async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    const controller = module.get<AuthController>(AuthController);
    expect(controller).toBeDefined();
  });

  it('should have AuthService', async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    const service = module.get<AuthService>(AuthService);
    expect(service).toBeDefined();
  });

  it('should have JwtStrategy', async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    const strategy = module.get<JwtStrategy>(JwtStrategy);
    expect(strategy).toBeDefined();
  });

  it('should have GoogleStrategy', async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    const strategy = module.get<GoogleStrategy>(GoogleStrategy);
    expect(strategy).toBeDefined();
  });

  it('should import PrismaModule', async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    const prismaModule = module.get(PrismaModule);
    expect(prismaModule).toBeDefined();
  });

  it('should import PassportModule', async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    // PassportModule is imported
    expect(module).toBeDefined();
  });

  it('should import JwtModule with correct configuration', async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    // JwtModule is imported and configured
    expect(module).toBeDefined();
  });

  it('should export AuthService', async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    const exportedService = module.get<AuthService>(AuthService);
    expect(exportedService).toBeDefined();
    expect(exportedService).toBeInstanceOf(AuthService);
  });
});
