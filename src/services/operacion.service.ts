import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateOperacionDTO } from 'src/dto/operacionDTO';
import { Operacion } from 'src/entities/operacion.entity';
import { TipoOperacion } from 'src/entities/tipo-operacion.enum';
import { Usuario } from 'src/entities/usuario.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { EntityManager } from 'typeorm';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
  }
}

@Injectable()
export class OperacionService {
  constructor(
    @InjectRepository(Operacion)
    private readonly operacionRepository: Repository<Operacion>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async create(
    createOperacionDTO: CreateOperacionDTO,
    manager?: EntityManager,
  ): Promise<Operacion> {
    const operacion = this.operacionRepository.create({
      ...createOperacionDTO,
      usuario: { idUsuario: createOperacionDTO.idUsuario } as Usuario,
    });

    if (manager) {
      return await manager.save(Operacion, operacion);
    }

    return await this.operacionRepository.save(operacion);
  }

  async getOperacionesByUsuarioId(
    idUsuario: string,
    clienteId: string,
    page: number,
    limit: number,
    tipo?: TipoOperacion
  ): Promise<PaginatedResult<Operacion>> {

    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario, cliente: { idCliente: clienteId } }
    });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado o no pertenece al cliente especificado');
    }

    const whereConditions: FindOptionsWhere<Operacion> = {
      usuario: { idUsuario },
      cliente: { idCliente: clienteId },
    };

    if (tipo) {
      whereConditions.tipo = tipo;
    }

    const [data, total] = await this.operacionRepository.findAndCount({
      where: whereConditions,
      order: { fechaRealizacion: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
