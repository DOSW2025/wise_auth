import 'dotenv/config';
import * as joi from 'joi';
import type { StringValue } from 'ms';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
  DIRECT_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRATION: StringValue | number;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  GATEWAY_URL: string;
  SERVICEBUS_CONNECTION_STRING: string;
}
const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string().required(),
    DIRECT_URL: joi.string().required(),
    JWT_SECRET: joi.string().required(),
    JWT_EXPIRATION: joi.alternatives().try(joi.string(), joi.number()).required(),
    GOOGLE_CLIENT_ID: joi.string().required(),
    GOOGLE_CLIENT_SECRET: joi.string().required(),
    GOOGLE_CALLBACK_URL: joi.string().required(),
    GATEWAY_URL: joi.string().required(),
    SERVICEBUS_CONNECTION_STRING: joi.string().required(),
  })
  .unknown(true);

const result = envsSchema.validate(process.env);
if (result.error) {
  throw new Error(`Config validation error: ${result.error.message}`);
}
const envVars = result.value as EnvVars;

export const envs = {
  port: envVars.PORT,
  databaseurl: envVars.DATABASE_URL,
  databasedirect: envVars.DIRECT_URL,
  jwtSecret: envVars.JWT_SECRET,
  jwtexpiration: envVars.JWT_EXPIRATION,
  googleClientId: envVars.GOOGLE_CLIENT_ID,
  googleClientSecret: envVars.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: envVars.GOOGLE_CALLBACK_URL,
  gatewayUrl: envVars.GATEWAY_URL.startsWith('http') ? envVars.GATEWAY_URL : `https://${envVars.GATEWAY_URL}`,
  servicebusconnectionstring: envVars.SERVICEBUS_CONNECTION_STRING,
};
