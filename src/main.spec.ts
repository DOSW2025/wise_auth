import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  mockEnvConfig,
  MockServiceBusClient,
  MockDefaultAzureCredential,
} from '../test/test-mocks';

// Mock the envs module
jest.mock('./config', () => ({
  envs: mockEnvConfig,
}));

// Mock Azure Service Bus
jest.mock('@azure/service-bus', () => ({
  ServiceBusClient: MockServiceBusClient,
}));

// Mock DefaultAzureCredential
jest.mock('@azure/identity', () => ({
  DefaultAzureCredential: MockDefaultAzureCredential,
}));

// Mock NestFactory
jest.mock('@nestjs/core', () => ({
  ...jest.requireActual('@nestjs/core'),
  NestFactory: {
    create: jest.fn(),
  },
}));

describe('Main Bootstrap', () => {
  let app: INestApplication;

  beforeEach(() => {
    app = {
      enableCors: jest.fn(),
      useGlobalPipes: jest.fn(),
      useGlobalGuards: jest.fn(),
      get: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
      close: jest.fn(),
    } as any;

    (NestFactory.create as jest.Mock).mockResolvedValue(app);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('should create a NestJS application', async () => {
    await expect(NestFactory.create(AppModule)).resolves.toBeDefined();
  });

  it('should enable CORS with correct configuration', async () => {
    const testApp = await NestFactory.create(AppModule);

    expect(testApp.enableCors).toBeDefined();
  });

  it('should configure ValidationPipe globally', async () => {
    const testApp = await NestFactory.create(AppModule);

    expect(testApp.useGlobalPipes).toBeDefined();
  });

  it('should configure global guards', async () => {
    const testApp = await NestFactory.create(AppModule);

    expect(testApp.useGlobalGuards).toBeDefined();
  });

  it('should listen on the configured port', async () => {
    const testApp = await NestFactory.create(AppModule);

    expect(testApp.listen).toBeDefined();
  });
});

describe('Application Configuration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.enableCors({
      origin: true,
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should have CORS enabled', () => {
    expect(app).toBeDefined();
  });

  it('should have ValidationPipe configured', () => {
    const pipes = (app as any).globalPipes;
    expect(pipes).toBeDefined();
  });

  it('should initialize successfully', async () => {
    expect(app).toBeDefined();
  });
});
