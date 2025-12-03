/**
 * Shared test mocks and utilities
 * This file contains common mock configurations used across multiple test files
 *
 * Usage: Import this file at the top of your test files before other imports
 */

// Mock configuration values
export const mockEnvConfig = {
  port: 3001,
  jwtSecret: 'test-secret',
  jwtExpiration: '1h',
  googleClientId: 'test-client-id',
  googleClientSecret: 'test-secret',
  googleCallbackUrl: 'http://localhost:3001/auth/google/callback',
  databaseUrl: 'postgresql://test:test@localhost:5432/test',
  directUrl: 'postgresql://test:test@localhost:5432/test',
  servicebusconnectionstring: 'test-connection-string',
};

// Mock Azure Service Bus client
export const mockServiceBusClient = {
  createSender: jest.fn().mockReturnValue({
    sendMessages: jest.fn(),
    close: jest.fn(),
  }),
  close: jest.fn(),
};

// Mock Service Bus Client constructor
export const MockServiceBusClient = jest.fn().mockImplementation(() => mockServiceBusClient);

// Mock DefaultAzureCredential
export const MockDefaultAzureCredential = jest.fn();
