import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { PlanesSuscripcion } from './planes-suscripcion.enum';
import { Usuario } from './usuario.entity';
import { Rol } from './rol.entity';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn()
  idCliente: number;

  @Column({ type: 'char', length: 1 })
  estado: string;

  @Column()
  mailContacto: string;

  @Column()
  nombre: string;

  @Column({ type: 'enum', enum: PlanesSuscripcion })
  plan: PlanesSuscripcion;

  @OneToMany(() => Usuario, (usuario) => usuario.cliente)
  usuarios: Usuario[];

  @ManyToMany(() => Rol)
  @JoinTable({ name: 'cliente_roles' }) // Tabla intermedia si aplica directa
  roles: Rol[];
}