import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ClienteService } from '../services/cliente.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly clienteService: ClienteService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException(
        'Faltan credenciales de API corporativas (X-API-Key)',
      );
    }

    const clienteValido = await this.clienteService.validateApiKey(apiKey);
    if (!clienteValido) {
      throw new UnauthorizedException(
        'Credenciales de integración API inválidas o revocadas',
      );
    }

    request.idCliente = clienteValido.idCliente;
    request.cliente = clienteValido;
    
    return true;
  }
}
