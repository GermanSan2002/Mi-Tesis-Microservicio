import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cliente } from './cliente.entity';
import { EstadosEntidades } from './estadosEntidades';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn('uuid')
  idRol: string;

  @Column()
  descripcion: string;

  @Column({ type: 'enum', enum: EstadosEntidades })
  estado: EstadosEntidades;

  @Column()
  nombre: string;

  @ManyToOne(() => Cliente, (cliente) => cliente.roles)
  cliente: Cliente;
}
