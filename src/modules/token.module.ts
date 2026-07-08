import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from 'src/entities/usuario.entity'; 
import { TokenService } from 'src/services/token.service';
import { JwtModule } from '@nestjs/jwt';
import { Sesion } from 'src/entities/sesion.entity';
import { SesionModule } from './sesion.module';
import { UsuarioModule } from './usuario.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/strategy/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '1h',
      },
    }),
    SesionModule,
    UsuarioModule,
  ],
  providers: [TokenService, JwtStrategy],
  exports: [TokenService],
})
export class TokenModule {}