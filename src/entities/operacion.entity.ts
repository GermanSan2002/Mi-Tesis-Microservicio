import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';
import { TipoOperacion } from './tipo-operacion.enum';
import { Cliente } from './cliente.entity';

@Entity('operaciones')
export class Operacion {
  @PrimaryGeneratedColumn('uuid')
  idOperacion: string;

  @Column({ nullable: true })
  idUsuario?: string | null;

  @Column({ nullable: false })
  idCliente: string;

  @Column({ type: 'timestamp' })
  fechaRealizacion: Date;

  @Column({ type: 'json', nullable: true })
  metadatos: any;

  @Column({ type: 'enum', enum: TipoOperacion })
  tipo: string;


  @ManyToOne(() => Usuario, (usuario) => usuario.operaciones, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({name: 'idUsuario'})
  usuario: Usuario;

  @ManyToOne(() => Cliente, (cliente) => cliente.operaciones, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({name: 'idCliente'})
  cliente: Cliente;
}
