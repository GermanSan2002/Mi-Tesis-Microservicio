import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSesionDTO } from 'src/dto/sesionDTO';
import { Sesion } from 'src/entities/sesion.entity';
import { Usuario } from 'src/entities/usuario.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class SesionService {
  constructor(
    @InjectRepository(Sesion)
    private readonly sesionRepository: Repository<Sesion>,
  ) {}

  // Helper privado para resolver dinámicamente si se usa la transacción activa o el repositorio estándar
  private getRepository(manager?: EntityManager): Repository<Sesion> {
    return manager ? manager.getRepository(Sesion) : this.sesionRepository;
  }

  async create(createSesionDTO: CreateSesionDTO, manager?: EntityManager): Promise<Sesion> {
    const sesion = this.sesionRepository.create({
      ...createSesionDTO,
      usuario: { idUsuario: createSesionDTO.idUsuario } as Usuario,
      creadoEn: new Date(),
      ultimoUsoEn: new Date(),
    });

    return await this.getRepository(manager).save(sesion);
  }

  async updateRefreshTokenHash(
    idSesion: string,
    refreshTokenHash: string,
    manager?: EntityManager,
  ): Promise<Sesion> {
    const repo = this.getRepository(manager);
    const sesion = await repo.findOne({
      where: { idSesion },
    });

    if (!sesion) {
      throw new NotFoundException('Session not found');
    }

    sesion.refreshTokenHash = refreshTokenHash;
    sesion.ultimoUsoEn = new Date();

    return await repo.save(sesion);
  }

  async updateSessionState(sesionId: string, estado: string, manager?: EntityManager) {
    const repo = this.getRepository(manager);
    const sesion = await repo.findOne({
      where: { idSesion: sesionId },
    });

    if (!sesion) {
      throw new NotFoundException('Session not found');
    }

    sesion.estado = estado;
    sesion.ultimoUsoEn = new Date();

    return await repo.save(sesion);
  }

  async hasActiveSession(idUsuario: string, manager?: EntityManager): Promise<boolean> {
    const repo = this.getRepository(manager);
    const count = await repo.count({
      where: {
        usuario: { idUsuario },
        estado: 'A',
      },
    });

    return count > 0;
  }

  async findById(idSesion: string, manager?: EntityManager): Promise<Sesion | null> {
    const repo = this.getRepository(manager);
    const sesion = await repo.findOne({
      where: { idSesion },
      relations: ['usuario'],
    });

    return sesion;
  }

  async updateSesion(Sesion: Sesion, manager?: EntityManager): Promise<Sesion> {
    const repo = this.getRepository(manager);
    return await repo.save(Sesion);
  }

  async isActiveSession(idSesion: string, manager?: EntityManager): Promise<boolean> {
    const repo = this.getRepository(manager);
    const count = await repo.count({
      where: {
        idSesion,
        estado: 'A',
      },
    });

    return count > 0;
  }

  async validateSession(
    idSesion: string,
    idUsuario: string,
    manager?: EntityManager,
  ): Promise<Sesion> {
    const repo = this.getRepository(manager);
    const sesion = await repo.findOne({
      where: { idSesion },
      relations: ['usuario'],
    });

    if (!sesion) {
      throw new UnauthorizedException('Session not found');
    }

    if (sesion.usuario.idUsuario !== idUsuario) {
      throw new UnauthorizedException('Invalid session');
    }

    if (sesion.estado !== 'A') {
      throw new UnauthorizedException('Session is inactive');
    }

    if (sesion.expiraEn < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    return sesion;
  }
}
