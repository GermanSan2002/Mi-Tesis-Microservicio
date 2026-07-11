import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SesionService } from 'src/services/sesion.service';
import { AccessTokenPayload } from 'src/services/token.service'; // Ajustá las rutas

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly sesionService: SesionService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret-facet',
      passReqToCallback: true,
    });
  }

  /**
   * Se ejecuta AUTOMÁTICAMENTE si el token pasó la validación criptográfica de Passport.
   * @param payload Es el JSON decodificado del token (coincide con tu AccessTokenPayload)
   */
  async validate(req: any, payload: any): Promise<AccessTokenPayload> {
    try {
      console.log('Sesion: ' + payload.sesionId);
      console.log('Usuario: ' + payload.userId);
      await this.sesionService.validateSession(
        payload.sesionId,
        payload.userId,
      );

      return {
        userId: payload.userId,
        idCliente: payload.idCliente, // Crucial para tu Tenant Isolation
        tipo: payload.tipo, // Crucial para tu TipoUsuarioGuard
        sesionId: payload.sesionId,
        roles: payload.roles,
      };
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException(
        'La sesión asociada a este token ha expirado o fue revocada',
      );
    }
  }
}
