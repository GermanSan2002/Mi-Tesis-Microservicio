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

  @OneToMany(() => Rol, (rol) => rol.cliente)
  roles: Rol[];
}
