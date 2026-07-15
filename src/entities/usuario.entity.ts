import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
  JoinColumn,
} from 'typeorm';
import { Cliente } from './cliente.entity';
import { TipoUsuario } from './tipo-usuario.enum';
import { Sesion } from './sesion.entity';
import { Operacion } from './operacion.entity';
import { Rol } from './rol.entity';
import { EstadosEntidades } from './estadosEntidades';

@Entity('usuarios')
@Index(['correo'])
@Index(['correo', 'idCliente'], { unique: true })
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  idUsuario: string;

  @Column({ nullable: false })
  idCliente: string;
  
  @Column()
  contraseña: string;

  @Column()
  correo: string;

  @Column({ type: 'enum', enum: EstadosEntidades })
  estado: EstadosEntidades;

  @Column({ type: 'json', nullable: true })
  parametros: any;

  @Column({ type: 'enum', enum: TipoUsuario })
  tipo: TipoUsuario;

  @Column({ type: 'boolean', default: false })
  verificado: boolean;

  @Column({ type: 'int', default: 0 })
  intentosFallidosLogin: number;

  @Column({nullable: true})
  recuperacionTokenHash: string

  @ManyToOne(() => Cliente, (cliente) => cliente.usuarios)
  @JoinColumn({name: 'idCliente'})
  cliente: Cliente;

  @OneToMany(() => Sesion, (sesion) => sesion.usuario)
  sesiones: Sesion[];

  @OneToMany(() => Operacion, (operacion) => operacion.usuario)
  operaciones: Operacion[];

  @ManyToMany(() => Rol)
  @JoinTable({
    name: 'usuario_rol', // Nombre de la tabla intermedia 'UsuarioRol'
    joinColumn: { name: 'idUsuario', referencedColumnName: 'idUsuario' },
    inverseJoinColumn: { name: 'idRol', referencedColumnName: 'idRol' },
  })
  roles: Rol[];
}