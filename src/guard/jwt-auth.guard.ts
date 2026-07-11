import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    console.log('Token recibido:', token);
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      console.log('Error JWT:', err);
      throw (
        err ||
        new UnauthorizedException(
          'Token de acceso inválido, expirado o ausente',
        )
      );
    }
    return user;
  }
}
