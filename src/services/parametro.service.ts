import { BadRequestException, ConflictException, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateParametroDto, UpdateParametroDto } from "../dto/parametroDTO";
import { EstadosEntidades } from "../entities/estadosEntidades";
import { Parametro } from "../entities/parametro.entity";
import { TipoParametro } from "../entities/tipo-parametro.enum";
import { Repository, DataSource, EntityManager } from "typeorm";

export class ParametroService {
    constructor(
        @InjectRepository(Parametro)
        private readonly parametroRepository: Repository<Parametro>,
        private readonly dataSource: DataSource,
    ) { }

    private validarTipoYRangos(
        nombre: string,
        valor: any,
        tipo: TipoParametro,
        min?: number | null,
        max?: number | null,
    ): void {
        switch (tipo) {
            case TipoParametro.NUMBER:
                if (typeof valor !== 'number' || isNaN(valor)) {
                    throw new BadRequestException(`El parámetro '${nombre}' debe ser un número (number)`);
                }
                if (min !== undefined && min !== null && valor < min) {
                    throw new BadRequestException(`El parámetro '${nombre}' no puede ser menor a ${min}`);
                }
                if (max !== undefined && max !== null && valor > max) {
                    throw new BadRequestException(`El parámetro '${nombre}' no puede ser mayor a ${max}`);
                }
                break;

            case TipoParametro.INTEGER:
                if (!Number.isInteger(valor)) {
                    throw new BadRequestException(`El parámetro '${nombre}' debe ser un entero (integer)`);
                }
                if (min !== undefined && min !== null && valor < min) {
                    throw new BadRequestException(`El parámetro '${nombre}' no puede ser menor a ${min}`);
                }
                if (max !== undefined && max !== null && valor > max) {
                    throw new BadRequestException(`El parámetro '${nombre}' no puede ser mayor a ${max}`);
                }
                break;

            case TipoParametro.STRING:
                if (typeof valor !== 'string') {
                    throw new BadRequestException(`El parámetro '${nombre}' debe ser una cadena de texto (string)`);
                }
                break;

            case TipoParametro.BOOLEAN:
                if (typeof valor !== 'boolean') {
                    throw new BadRequestException(`El parámetro '${nombre}' debe ser un valor booleano (boolean)`);
                }
                break;

            case TipoParametro.DATE:
                const fecha = new Date(valor);
                if (isNaN(fecha.getTime())) {
                    throw new BadRequestException(`El parámetro '${nombre}' debe ser una fecha válida (ISO 8601)`);
                }
                break;

            default:
                throw new BadRequestException(`Tipo de parámetro no soportado: ${tipo}`);
        }
    }

    private validarTipoYRestricciones(
        nombre: string,
        valor: any,
        def: Parametro,
    ): void {
        const { tipo, valorMinimo, valorMaximo } = def;

        switch (tipo) {
            case TipoParametro.NUMBER:
                if (typeof valor !== 'number' || isNaN(valor)) {
                    throw new BadRequestException(
                        `El parámetro '${nombre}' debe ser de tipo numérico (number)`,
                    );
                }
                if (valorMinimo !== null && valorMinimo !== undefined && valor < valorMinimo) {
                    throw new BadRequestException(
                        `El parámetro '${nombre}' (${valor}) es inferior al mínimo permitido (${valorMinimo})`,
                    );
                }
                if (valorMaximo !== null && valorMaximo !== undefined && valor > valorMaximo) {
                    throw new BadRequestException(
                        `El parámetro '${nombre}' (${valor}) supera el máximo permitido (${valorMaximo})`,
                    );
                }
                break;

            case TipoParametro.INTEGER:
                if (!Number.isInteger(valor)) {
                    throw new BadRequestException(
                        `El parámetro '${nombre}' debe ser un número entero (integer)`,
                    );
                }
                if (valorMinimo !== null && valorMinimo !== undefined && valor < valorMinimo) {
                    throw new BadRequestException(
                        `El parámetro '${nombre}' (${valor}) es inferior al mínimo permitido (${valorMinimo})`,
                    );
                }
                if (valorMaximo !== null && valorMaximo !== undefined && valor > valorMaximo) {
                    throw new BadRequestException(
                        `El parámetro '${nombre}' (${valor}) supera el máximo permitido (${valorMaximo})`,
                    );
                }
                break;

            case TipoParametro.STRING:
                if (typeof valor !== 'string') {
                    throw new BadRequestException(
                        `El parámetro '${nombre}' debe ser de tipo cadena de texto (string)`,
                    );
                }
                break;

            case TipoParametro.BOOLEAN:
                if (typeof valor !== 'boolean') {
                    throw new BadRequestException(
                        `El parámetro '${nombre}' debe ser de tipo booleano (boolean)`,
                    );
                }
                break;

            case TipoParametro.DATE:
                const fecha = new Date(valor);
                if (isNaN(fecha.getTime())) {
                    throw new BadRequestException(
                        `El parámetro '${nombre}' debe ser una fecha válida en formato ISO 8601`,
                    );
                }
                break;

            default:
                throw new BadRequestException(
                    `Tipo de parámetro no reconocido o no soportado: '${tipo}'`,
                );
        }
    }

    private getRepository(manager?: EntityManager): Repository<Parametro> {
        return manager ? manager.getRepository(Parametro) : this.parametroRepository;
    }

    async findByIdAndClient(idParametro: string, idCliente: string): Promise<Parametro> {
        const parametro = await this.parametroRepository.findOne(
            {
                where: {
                    idParametro: idParametro,
                    idCliente: idCliente
                }
            });

        if (!parametro) {
            throw new NotFoundException("No existe el parametro");
        }

        return parametro;
    }

    async findByNameAndCliente(nombre: string, idCliente: string): Promise<Parametro | null> {
        const parametro = await this.parametroRepository.findOne(
            {
                where: {
                    nombre: nombre,
                    idCliente: idCliente
                }
            });

        return parametro;
    }

    async createParametro(
        dto: CreateParametroDto,
        idCliente: string
    ): Promise<Parametro> {
        const existe = await this.findByNameAndCliente(dto.nombre, idCliente);
        
        if(existe){
            throw new ConflictException(`El parámetro '${dto.nombre}' ya existe para esta empresa`);
        }

        if (dto.valorPorDefecto !== undefined && dto.valorPorDefecto !== null) {
            this.validarTipoYRangos(
                dto.nombre,
                dto.valorPorDefecto,
                dto.tipo,
                dto.valorMinimo,
                dto.valorMaximo,
            );
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const repo = this.getRepository(queryRunner.manager);

            const parametro = repo.create({
                ...dto,
                estado: EstadosEntidades.ALTA,
                idCliente: idCliente
            });

            await repo.save(parametro);

            await queryRunner.commitTransaction();

            return parametro;
        } catch (err) {
            await queryRunner.rollbackTransaction();

            throw new InternalServerErrorException('Could not register parameter');
        } finally {
            await queryRunner.release();
        }
    }

    async obtenerParametrosPorCliente(
        idCliente: string,
        manager?: EntityManager,
    ): Promise<Parametro[]> {
        const repo = this.getRepository(manager);

        return await repo.find({ where: { idCliente, estado: EstadosEntidades.ALTA } });
    }

    async modificarParametro(dto: UpdateParametroDto, idCliente: string, idParametro: string) {
        const parametro = await this.findByIdAndClient(idParametro, idCliente);

        if (!parametro) {
            throw new NotFoundException('Parámetro no encontrado');
        }

        const nuevoTipo = dto.tipo || parametro.tipo;
        const nuevoMin = dto.valorMinimo !== undefined ? dto.valorMinimo : parametro.valorMinimo;
        const nuevoMax = dto.valorMaximo !== undefined ? dto.valorMaximo : parametro.valorMaximo;

        const valorDefectoAValidar =
            dto.valorPorDefecto !== undefined ? dto.valorPorDefecto : parametro.valorPorDefecto;

        if (valorDefectoAValidar !== undefined && valorDefectoAValidar !== null) {
            this.validarTipoYRangos(
                parametro.nombre,
                valorDefectoAValidar,
                nuevoTipo,
                nuevoMin,
                nuevoMax,
            );
        };

        Object.assign(parametro, dto);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const repo = this.getRepository(queryRunner.manager);
            await repo.save(parametro);
            await queryRunner.commitTransaction();
            return parametro;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw new InternalServerErrorException('Could not register parameter');
        } finally {
            await queryRunner.release();
        }
    }

    async verifyParametros(parametros: any, idCliente: string): Promise<boolean>{
        if (!parametros || Object.keys(parametros).length === 0) {
            return true;
        }

        const parametrosCliente = await this.obtenerParametrosPorCliente(idCliente);

        const mapaCatalogo = new Map<string, Parametro>(
            parametrosCliente.map((p) => [p.nombre, p]),
        );

        for (const [clave, valor] of Object.entries(parametros)) {
            const def = mapaCatalogo.get(clave);

            if (!def) {
                throw new BadRequestException(
                    `El parámetro '${clave}' no está definido o no se encuentra activo para este cliente`,
                );
            }

            this.validarTipoYRestricciones(clave, valor, def);
        }

        return true;
    }

    async darBajaParametro(idParametro: string, idCliente){
        const parametro = await this.findByIdAndClient(idParametro, idCliente);

        if(parametro.estado === EstadosEntidades.BAJA){
            throw new BadRequestException('El parámetro ya se encuentra inactivo');
        }
        parametro.estado = EstadosEntidades.BAJA;

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const repo = this.getRepository(queryRunner.manager);
            await repo.save(parametro);
            await queryRunner.commitTransaction();
            return parametro;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw new InternalServerErrorException('Could not register parameter');
        } finally {
            await queryRunner.release();
        }       
    }

    async darAltaParametro(idParametro: string, idCliente): Promise<Parametro>{
        const parametro = await this.findByIdAndClient(idParametro, idCliente);

        if(parametro.estado === EstadosEntidades.ALTA){
            throw new BadRequestException('El parámetro ya se encuentra activo');
        }
        parametro.estado = EstadosEntidades.ALTA;

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const repo = this.getRepository(queryRunner.manager);
            await repo.save(parametro);
            await queryRunner.commitTransaction();
            return parametro;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw new InternalServerErrorException('Could not register parameter');
        } finally {
            await queryRunner.release();
        }       
    }
}