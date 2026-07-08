import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { PlanesSuscripcion } from './planes-suscripcion.enum';
import { Usuario } from './usuario.entity';
import { Rol } from './rol.entity';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  idCliente: string;

  @Column({ type: 'char', length: 1 })
  estado: string;

  @Column()
  mailContacto: string;

  @Column({ name: 'api_key_hash', nullable: true, select: false })
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