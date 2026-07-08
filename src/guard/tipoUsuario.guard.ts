import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TipoUsuario } from 'src/entities/tipo-usuario.enum';

@Injectable()
export class TipoUsuarioGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener los tipos de usuario permitidos para este endpoint desde los metadatos
    const tipoValidar = this.reflector.get<TipoUsuario[]>('tipo', context.getHandler());
    console.log("Tipo a validar:" + tipoValidar);
    if (!tipoValidar) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    console.log(user);

    if (!user) {
      throw new UnauthorizedException('No autenticado');
    }

    // Validar que el tipo de usuario en el JWT coincida con los permitidos
    const valiidarTipo = (tipoValidar == user.tipo);

    if (!valiidarTipo) {
      throw new ForbiddenException('No tienes permisos para acceder a este recurso');
    }

    return true;
  }
}