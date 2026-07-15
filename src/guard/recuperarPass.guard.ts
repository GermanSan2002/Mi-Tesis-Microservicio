import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { TokenService } from "src/services/token.service";
import { UsuarioService } from "src/services/usuario.service";

@Injectable()
export class RecuperarPassGuard implements CanActivate {
    constructor(
        private readonly tokenService: TokenService,
        private readonly usuarioService: UsuarioService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const recoverToken = request.headers['x-token-recover'];
        if (!recoverToken) {
            throw new UnauthorizedException(
              'Falta token de recuperacion (x-token-recover)',
            );
        }

        // Verifico que el token no haya expirado
        const payload = await this.tokenService.verifyRecuperarToken(recoverToken);

        // Verifico que sea correcto
        const UsuarioValido = this.usuarioService.verifySolicitudCambio(payload.userId, recoverToken);
        if(!UsuarioValido){
            throw new UnauthorizedException("Solicitud invalida para el usuario")
        }
        
        request.usuarioId = payload.userId;
        request.user = UsuarioValido

        return true;
    }
}