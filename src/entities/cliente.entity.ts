import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { PlanesSuscripcion } from './planes-suscripcion.enum';
import { Usuario } from './usuario.entity';
import { Rol } from './rol.entity';
import { EstadosEntidades } from './estadosEntidades';
import { Operacion } from './operacion.entity';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  idCliente: string;

  @Column({ type: 'enum', enum: EstadosEntidades })
  estado: EstadosEntidades;

  @Column()
  mailContacto: string;

  @Column({ name: 'api_key_hash', nullable: true, select: false, unique: true })
  apiKeyHash: string;

  @Column()
  nombre: string;

  @Column({ type: 'enum', enum: PlanesSuscripcion })
  plan: PlanesSuscripcion;

  @OneToMany(() => Usuario, (usuario) => usuario.cliente)
  usuarios: Usuario[];

  @OneToMany(() => Operacion, (operacion) => operacion.cliente)
  operaciones: Operacion[];

  @OneToMany(() => Rol, (rol) => rol.cliente)
  roles: Rol[];
}
