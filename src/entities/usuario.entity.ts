import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Cliente } from './cliente.entity';
import { TipoUsuario } from './tipo-usuario.enum';
import { Sesion } from './sesion.entity';
import { Operacion } from './operacion.entity';
import { Rol } from './rol.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  idUsuario: string;

  @Column()
  contraseña: string; // Recordá encriptarla antes de guardar

  @Column()
  correo: string;

  @Column({ type: 'char', length: 1 })
  estado: string;

  @Column({ type: 'json', nullable: true })
  parametros: any;

  @Column({ type: 'enum', enum: TipoUsuario })
  tipo: TipoUsuario;

  @Column({ type: 'boolean', default: false })
  verificado: boolean;

  // Relación con Cliente (Muchos usuarios pertenecen a 1 Cliente)
  @ManyToOne(() => Cliente, (cliente) => cliente.usuarios)
  cliente: Cliente;

  @OneToMany(() => Sesion, (sesion) => sesion.usuario)
  sesiones: Sesion[];

  @OneToMany(() => Operacion, (operacion) => operacion.usuario)
  operaciones: Operacion[];

  // Un usuario tiene muchos roles y un rol puede pertenecer a muchos usuarios (relación muchos a muchos)
  @ManyToMany(() => Rol)
  @JoinTable({
    name: 'usuario_rol', // Nombre de la tabla intermedia 'UsuarioRol'
    joinColumn: { name: 'idUsuario', referencedColumnName: 'idUsuario' },
    inverseJoinColumn: { name: 'idRol', referencedColumnName: 'idRol' }
  })
  roles: Rol[];
}