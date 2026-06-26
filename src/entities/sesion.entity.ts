import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('sesiones')
export class Sesion {
  @PrimaryGeneratedColumn()
  idSesion: number;

  @Column({ type: 'timestamp' })
  creadoEn: Date;

  @Column({ type: 'char', length: 1 })
  estado: string;

  @Column({ type: 'timestamp' })
  expiraEn: Date;

  @Column()
  refreshTokenHash: string;

  @Column({ type: 'timestamp' })
  ultimoUsoEn: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.sesiones)
  usuario: Usuario;
}