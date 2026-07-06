import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cliente } from './cliente.entity';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn('uuid')
  idRol: string;

  @Column()
  descripcion: string;

  @Column({ type: 'char', length: 1 })
  estado: string;

  @Column()
  nombre: string;

  @ManyToOne(() => Cliente, (cliente) => cliente.roles)
  cliente: Cliente;
}