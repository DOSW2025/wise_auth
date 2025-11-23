import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { envs } from 'src/config';
import { Role } from '../enums/role.enum';

export interface JwtPayload {
  sub: string; // ID del usuario
  email: string;
  rol: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envs.jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.email || !payload.rol) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // El payload validado estará disponible en req.user
    return {
      id: payload.sub,
      email: payload.email,
      rol: payload.rol,
    };
  }
}
