import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Usuario } from './usuario.entity';
import { TipoOperacion } from './tipo-operacion.enum';

@Entity('operaciones')
export class Operacion {
  @PrimaryGeneratedColumn('uuid')
  idOperacion: string;

  @Column({ type: 'timestamp' })
  fechaRealizacion: Date;

  @Column({ type: 'json', nullable: true })
  metadatos: any;

  @Column({ type: 'enum', enum: TipoOperacion })
  tipo: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.operaciones)
  usuario: Usuario;
}
