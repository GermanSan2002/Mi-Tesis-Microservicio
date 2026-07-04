import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSesionDTO } from 'src/dto/sesionDTO';
import { Sesion } from 'src/entities/sesion.entity';
import { Usuario } from 'src/entities/usuario.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SesionService {
  constructor(
    @InjectRepository(Sesion)
    private readonly sesionRepository: Repository<Sesion>,
  ) {}

  async create(createSesionDTO: CreateSesionDTO): Promise<Sesion> {
    const sesion = this.sesionRepository.create({
      ...createSesionDTO,
      usuario: { idUsuario: createSesionDTO.idUsuario } as Usuario,
      creadoEn: new Date(),
      ultimoUsoEn: new Date(),
    });

    return await this.sesionRepository.save(sesion);
  }

  async updateRefreshTokenHash(
    idSesion: number,
    refreshTokenHash: string,
  ): Promise<Sesion> {
    const sesion = await this.sesionRepository.findOne({
      where: { idSesion },
    });

    if (!sesion) {
      throw new NotFoundException('Session not found');
    }

    sesion.refreshTokenHash = refreshTokenHash;
    sesion.ultimoUsoEn = new Date();

    return await this.sesionRepository.save(sesion);
  }

  async updateSessionState(sesionId: number, estado: string) {
    const sesion = await this.sesionRepository.findOne({
      where: { idSesion: sesionId },
    });

    if (!sesion) {
      throw new NotFoundException('Session not found');
    }

    sesion.estado = estado;
    sesion.ultimoUsoEn = new Date();

    return await this.sesionRepository.save(sesion);
  }

  async hasActiveSession(idUsuario: number): Promise<boolean> {
    const count = await this.sesionRepository.count({
      where: {
        usuario: { idUsuario },
        estado: 'A',
      },
    });

    return count > 0;
  }

  async findById(idSesion: number): Promise<Sesion | null> {
    const sesion = await this.sesionRepository.findOne({
      where: { idSesion },
      relations: ['usuario'],
    });

    return sesion;
  }

  async updateSesion(Sesion: Sesion): Promise<Sesion> {
    return await this.sesionRepository.save(Sesion);
  }

  async isActiveSession(idSesion: number): Promise<boolean> {
    const count = await this.sesionRepository.count({
      where: {
        idSesion,
        estado: 'A',
      },
    });

    return count > 0;
  }

  async validateSession(
    idSesion: number,
    idUsuario: number,
  ): Promise<Sesion> {
    const sesion = await this.sesionRepository.findOne({
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
