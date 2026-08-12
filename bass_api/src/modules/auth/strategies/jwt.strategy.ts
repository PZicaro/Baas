import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { AUTH_COOKIE_NAME } from '../auth.constants';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

/** Lê o JWT exclusivamente do cookie httpOnly — nunca de header Authorization. */
function extractFromCookie(req: Request): string | null {
  return req?.cookies?.[AUTH_COOKIE_NAME] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: extractFromCookie,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret')!,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user || !user.active) {
      throw new UnauthorizedException('Usuário inválido ou inativo');
    }
    return user;
  }
}
