import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn()
  idRol: number;

  @Column()
  descripcion: string;

  @Column({ type: 'char', length: 1 })
  estado: string;

  @Column()
  nombre: string;
}