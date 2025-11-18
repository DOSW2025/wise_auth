import * as joi from 'joi';

describe('Environment Configuration', () => {
  // Define the schema to test (same as in envs.ts)
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
    })
    .unknown(true);

  describe('Environment Variables Schema Validation', () => {
    it('should validate correct environment variables', () => {
      const validEnv = {
        PORT: 3000,
        DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
        DIRECT_URL: 'postgresql://user:password@localhost:5432/db',
        JWT_SECRET: 'super-secret-key-123',
        JWT_EXPIRATION: '1h',
        GOOGLE_CLIENT_ID: 'google-client-id-123',
        GOOGLE_CLIENT_SECRET: 'google-client-secret-456',
        GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
      };

      const result = envsSchema.validate(validEnv);
      expect(result.error).toBeUndefined();
      expect(result.value).toMatchObject(validEnv);
    });

    it('should accept PORT as a number', () => {
      const env = {
        PORT: 3000,
        DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
        DIRECT_URL: 'postgresql://user:password@localhost:5432/db',
        JWT_SECRET: 'secret',
        JWT_EXPIRATION: '1h',
        GOOGLE_CLIENT_ID: 'id',
        GOOGLE_CLIENT_SECRET: 'secret',
        GOOGLE_CALLBACK_URL: 'http://localhost/callback',
      };

      const result = envsSchema.validate(env);
      expect(result.error).toBeUndefined();
    });

    it('should accept JWT_EXPIRATION as a string', () => {
      const env = {
        PORT: 3000,
        DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
        DIRECT_URL: 'postgresql://user:password@localhost:5432/db',
        JWT_SECRET: 'secret',
        JWT_EXPIRATION: '24h',
        GOOGLE_CLIENT_ID: 'id',
        GOOGLE_CLIENT_SECRET: 'secret',
        GOOGLE_CALLBACK_URL: 'http://localhost/callback',
      };

      const result = envsSchema.validate(env);
      expect(result.error).toBeUndefined();
      expect(result.value.JWT_EXPIRATION).toBe('24h');
    });

    it('should accept JWT_EXPIRATION as a number', () => {
      const env = {
        PORT: 3000,
        DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
        DIRECT_URL: 'postgresql://user:password@localhost:5432/db',
        JWT_SECRET: 'secret',
        JWT_EXPIRATION: 3600,
        GOOGLE_CLIENT_ID: 'id',
        GOOGLE_CLIENT_SECRET: 'secret',
        GOOGLE_CALLBACK_URL: 'http://localhost/callback',
      };

      const result = envsSchema.validate(env);
      expect(result.error).toBeUndefined();
      expect(result.value.JWT_EXPIRATION).toBe(3600);
    });

    it('should fail when PORT is missing', () => {
      const env = {
        DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
        DIRECT_URL: 'postgresql://user:password@localhost:5432/db',
        JWT_SECRET: 'secret',
        JWT_EXPIRATION: '1h',
        GOOGLE_CLIENT_ID: 'id',
        GOOGLE_CLIENT_SECRET: 'secret',
        GOOGLE_CALLBACK_URL: 'http://localhost/callback',
      };

      const result = envsSchema.validate(env);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('PORT');
    });

    it('should fail when DATABASE_URL is missing', () => {
      const env = {
        PORT: 3000,
        DIRECT_URL: 'postgresql://user:password@localhost:5432/db',
        JWT_SECRET: 'secret',
        JWT_EXPIRATION: '1h',
        GOOGLE_CLIENT_ID: 'id',
        GOOGLE_CLIENT_SECRET: 'secret',
        GOOGLE_CALLBACK_URL: 'http://localhost/callback',
      };

      const result = envsSchema.validate(env);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('DATABASE_URL');
    });

    it('should fail when DIRECT_URL is missing', () => {
      const env = {
        PORT: 3000,
        DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
        JWT_SECRET: 'secret',
        JWT_EXPIRATION: '1h',
        GOOGLE_CLIENT_ID: 'id',
        GOOGLE_CLIENT_SECRET: 'secret',
        GOOGLE_CALLBACK_URL: 'http://localhost/callback',
      };

      const result = envsSchema.validate(env);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('DIRECT_URL');
    });

    it('should fail when JWT_SECRET is missing', () => {
      const env = {
        PORT: 3000,
        DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
        DIRECT_URL: 'postgresql://user:password@localhost:5432/db',
        JWT_EXPIRATION: '1h',
        GOOGLE_CLIENT_ID: 'id',
        GOOGLE_CLIENT_SECRET: 'secret',
        GOOGLE_CALLBACK_URL: 'http://localhost/callback',
      };

      const result = envsSchema.validate(env);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('JWT_SECRET');
    });

    it('should fail when JWT_EXPIRATION is missing', () => {
      const env = {
        PORT: 3000,
        DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
        DIRECT_URL: 'postgresql://user:password@localhost:5432/db',
        JWT_SECRET: 'secret',
        GOOGLE_CLIENT_ID: 'id',
        GOOGLE_CLIENT_SECRET: 'secret',
        GOOGLE_CALLBACK_URL: 'http://localhost/callback',
      };

      const result = envsSchema.validate(env);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('JWT_EXPIRATION');
    });

    it('should fail when GOOGLE_CLIENT_ID is missing', () => {
      const env = {
        PORT: 3000,
        DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
        DIRECT_URL: 'postgresql://user:password@localhost:5432/db',
        JWT_SECRET: 'secret',
        JWT_EXPIRATION: '1h',
        GOOGLE_CLIENT_SECRET: 'secret',
        GOOGLE_CALLBACK_URL: 'http://localhost/callback',
      };

      const result = envsSchema.validate(env);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('GOOGLE_CLIENT_ID');
    });

    it('should fail when GOOGLE_CLIENT_SECRET is missing', () => {
      const env = {
        PORT: 3000,
        DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
        DIRECT_URL: 'postgresql://user:password@localhost:5432/db',
        JWT_SECRET: 'secret',
        JWT_EXPIRATION: '1h',
        GOOGLE_CLIENT_ID: 'id',
        GOOGLE_CALLBACK_URL: 'http://localhost/callback',
      };

      const result = envsSchema.validate(env);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('GOOGLE_CLIENT_SECRET');
    });

    it('should fail when GOOGLE_CALLBACK_URL is missing', () => {
      const env = {
        PORT: 3000,
        DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
        DIRECT_URL: 'postgresql://user:password@localhost:5432/db',
        JWT_SECRET: 'secret',
        JWT_EXPIRATION: '1h',
        GOOGLE_CLIENT_ID: 'id',
        GOOGLE_CLIENT_SECRET: 'secret',
      };

      const result = envsSchema.validate(env);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('GOOGLE_CALLBACK_URL');
    });

    it('should fail when PORT is not a number', () => {
      const env = {
        PORT: 'not-a-number',
        DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
        DIRECT_URL: 'postgresql://user:password@localhost:5432/db',
        JWT_SECRET: 'secret',
        JWT_EXPIRATION: '1h',
        GOOGLE_CLIENT_ID: 'id',
        GOOGLE_CLIENT_SECRET: 'secret',
        GOOGLE_CALLBACK_URL: 'http://localhost/callback',
      };

      const result = envsSchema.validate(env);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('must be a number');
    });

    it('should fail when DATABASE_URL is not a string', () => {
      const env = {
        PORT: 3000,
        DATABASE_URL: 12345,
        DIRECT_URL: 'postgresql://user:password@localhost:5432/db',
        JWT_SECRET: 'secret',
        JWT_EXPIRATION: '1h',
        GOOGLE_CLIENT_ID: 'id',
        GOOGLE_CLIENT_SECRET: 'secret',
        GOOGLE_CALLBACK_URL: 'http://localhost/callback',
      };

      const result = envsSchema.validate(env);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('must be a string');
    });

    it('should allow unknown environment variables', () => {
      const env = {
        PORT: 3000,
        DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
        DIRECT_URL: 'postgresql://user:password@localhost:5432/db',
        JWT_SECRET: 'secret',
        JWT_EXPIRATION: '1h',
        GOOGLE_CLIENT_ID: 'id',
        GOOGLE_CLIENT_SECRET: 'secret',
        GOOGLE_CALLBACK_URL: 'http://localhost/callback',
        SOME_OTHER_VAR: 'value',
        ANOTHER_VAR: 123,
      };

      const result = envsSchema.validate(env);
      expect(result.error).toBeUndefined();
    });

    it('should validate with realistic production values', () => {
      const env = {
        PORT: 8080,
        DATABASE_URL: 'postgresql://admin:secure_password@db.example.com:5432/production_db',
        DIRECT_URL: 'postgresql://admin:secure_password@db.example.com:5432/production_db',
        JWT_SECRET: 'very-long-and-secure-secret-key-for-production',
        JWT_EXPIRATION: '7d',
        GOOGLE_CLIENT_ID: '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',
        GOOGLE_CLIENT_SECRET: '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3456',
        GOOGLE_CALLBACK_URL: 'https://api.example.com/auth/google/callback',
      };

      const result = envsSchema.validate(env);
      expect(result.error).toBeUndefined();
      expect(result.value.PORT).toBe(8080);
      expect(result.value.JWT_EXPIRATION).toBe('7d');
    });
  });
});
