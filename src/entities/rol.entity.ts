import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Cliente } from './cliente.entity';
import { EstadosEntidades } from './estadosEntidades';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn('uuid')
  idRol: string;

  @Column({ nullable: false })
  idCliente: string;

  @Column()
  descripcion: string;

  @Column({ type: 'enum', enum: EstadosEntidades })
  estado: EstadosEntidades;

  @Column()
  nombre: string;

  @ManyToOne(() => Cliente, (cliente) => cliente.roles)
  @JoinColumn({ name: 'idCliente' })
  cliente: Cliente;
}
