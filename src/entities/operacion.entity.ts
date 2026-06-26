import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('operaciones')
export class Operacion {
  @PrimaryGeneratedColumn()
  idOperacion: number;

  @Column({ type: 'timestamp' })
  fechaRealizacion: Date;

  @Column({ type: 'json', nullable: true })
  metadatos: any;

  @Column()
  tipo: string; // O enum si el "tipo" requiere valores fijos

  @ManyToOne(() => Usuario, (usuario) => usuario.operaciones)
  usuario: Usuario;
}