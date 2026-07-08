import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // Si el token es inválido, expiró o no se envió, Passport devuelve 'user' como null
    if (err || !user) {
      throw err || new UnauthorizedException('Token de acceso inválido, expirado o ausente');
    }
    return user;
  }
}