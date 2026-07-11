import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { EstadosSesion } from './estadosSesiones.enum';

@Entity('sesiones')
@Index('IDX_sesion_activa_id', ['idSesion'], {
  where: `"estado" = '${EstadosSesion.ACTIVA}'`,
})
export class Sesion {
  @PrimaryGeneratedColumn('uuid')
  idSesion: string;

  @Column({ type: 'timestamp' })
  creadoEn: Date;

  @Column({ type: 'enum', enum: EstadosSesion })
  estado: EstadosSesion;

  @Column({ type: 'timestamp' })
  expiraEn: Date;

  @Column()
  refreshTokenHash: string;

  @Column({ type: 'timestamp' })
  ultimoUsoEn: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.sesiones)
  usuario: Usuario;
}
