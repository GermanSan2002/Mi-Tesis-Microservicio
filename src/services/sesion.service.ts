import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSesionDTO } from 'src/dto/sesionDTO';
import { EstadosSesion } from 'src/entities/estadosSesiones.enum';
import { Sesion } from 'src/entities/sesion.entity';
import { Usuario } from 'src/entities/usuario.entity';
import { DataSource, EntityManager, LessThan, Repository } from 'typeorm';

@Injectable()
export class SesionService {
  private readonly logger = new Logger(SesionService.name);

  constructor(
    @InjectRepository(Sesion)
    private readonly sesionRepository: Repository<Sesion>,
    private readonly dataSource: DataSource,
  ) {}

  // Helper privado para resolver dinámicamente si se usa la transacción activa o el repositorio estándar
  private getRepository(manager?: EntityManager): Repository<Sesion> {
    return manager ? manager.getRepository(Sesion) : this.sesionRepository;
  }

  /**
   * Tarea programada automatizada para dar de baja sesiones caducas.
   * Se ejecuta de forma predeterminada cada 30 minutos.
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async handleCleanExpiredSessions() {
    this.logger.log(
      'Iniciando proceso en segundo plano de limpieza de sesiones expiradas...',
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repoTransaccional = queryRunner.manager.getRepository(Sesion);
      const ahora = new Date();

      // Busca y actualiza de forma atómica todas las sesiones 'A' cuya fecha de expiración sea menor a 'ahora'
      const resultado = await repoTransaccional.update(
        {
          estado: EstadosSesion.ACTIVA,
          expiraEn: LessThan(ahora),
        },
        {
          estado: EstadosSesion.EXPIRADA,
          ultimoUsoEn: ahora,
        },
      );

      await queryRunner.commitTransaction();

      if (resultado.affected && resultado.affected > 0) {
        this.logger.warn(
          `Limpieza exitosa: Se invalidaron ${resultado.affected} sesiones expiradas de forma automatizada.`,
        );
      } else {
        this.logger.log(
          'No se encontraron sesiones expiradas para invalidar en este ciclo.',
        );
      }
    } catch (error) {
      // Si algo falla, se revierte para resguardar la consistencia lógica de la BD
      await queryRunner.rollbackTransaction();
      this.logger.error(
        'Error crítico durante la invalidación automática de sesiones:',
        error,
      );
    } finally {
      // Libera el QueryRunner de vuelta al Connection Pool
      await queryRunner.release();
    }
  }

  async create(
    createSesionDTO: CreateSesionDTO,
    manager?: EntityManager,
  ): Promise<Sesion> {
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

  async updateSessionState(
    sesionId: string,
    estado: EstadosSesion,
    manager?: EntityManager,
  ) {
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

  async hasActiveSession(
    idUsuario: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repo = this.getRepository(manager);
    const count = await repo.count({
      where: {
        usuario: { idUsuario },
        estado: EstadosSesion.ACTIVA,
      },
    });

    return count > 0;
  }

  async findById(
    idSesion: string,
    manager?: EntityManager,
  ): Promise<Sesion | null> {
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

  async isActiveSession(
    idSesion: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repo = this.getRepository(manager);
    const count = await repo.count({
      where: {
        idSesion,
        estado: EstadosSesion.ACTIVA,
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
