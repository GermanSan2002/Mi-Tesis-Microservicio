import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Cliente } from "./cliente.entity";
import { TipoParametro } from "./tipo-parametro.enum";
import { EstadosEntidades } from "./estadosEntidades";

@Entity('parametros')
@Unique('UQ_cliente_parametro_nombre', ['idCliente', 'nombre'])
export class Parametro {
    @PrimaryGeneratedColumn('uuid')
    idParametro: string;

    @Column({ nullable: false })
    idCliente: string;

    @Column({ type: 'varchar', length: 100 })
    nombre: string;

    @Column({ type: 'enum', enum: TipoParametro })
    tipo: TipoParametro;

    // Valor por defecto en formato JSON o texto simple
    @Column({ type: 'json', nullable: true })
    valorPorDefecto: any;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    valorMinimo?: number | null;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    valorMaximo?: number | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    descripcion?: string;

    @Column({ type: 'enum', enum: EstadosEntidades })
    estado: EstadosEntidades;

    @ManyToOne(() => Cliente, (cliente) => cliente.usuarios)
    @JoinColumn({ name: 'idCliente' })
    cliente: Cliente;
}