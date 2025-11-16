import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { envs } from 'src/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor() {
    super({
      clientID: envs.googleClientId,
      clientSecret: envs.googleClientSecret,
      callbackURL: envs.googleCallbackUrl,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const { id, name, emails, photos } = profile;

      const email = emails?.[0]?.value;

      if (!email) {
        this.logger.warn('No se pudo obtener el email del perfil de Google');
        return done(
          new Error('No se pudo obtener el email de la cuenta de Google'),
          false,
        );
      }

      const user = {
        googleId: id,
        email,
        nombre: name?.givenName || '',
        apellido: name?.familyName || '',
        avatarUrl: photos?.[0]?.value,
      };

      this.logger.log(`Usuario validado con Google: ${email}`);
      done(null, user);
    } catch (error) {
      this.logger.error(`Error en validación de Google OAuth: ${error.message}`);
      done(error, false);
    }
  }
}
