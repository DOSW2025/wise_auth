import 'dotenv/config';
import * as joi from 'joi';
import type { StringValue } from 'ms';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
  DIRECT_URL: string;
  JWT_SECRET:string;
  JWT_EXPIRATION: StringValue | number;
}
const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string().required(),
    DIRECT_URL: joi.string().required(),
    JWT_SECRET: joi.string().required(),
    JWT_EXPIRATION: joi.alternatives().try(joi.string(), joi.number()).required(),
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
  jwtsecret: envVars.JWT_SECRET,
  jwtexpiration: envVars.JWT_EXPIRATION,
};
