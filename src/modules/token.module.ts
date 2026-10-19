import { Module } from '@nestjs/common';
import { TokenService } from '../services/token.service';
import { JwtModule } from '@nestjs/jwt';
import { SesionModule } from './sesion.module';
import { UsuarioModule } from './usuario.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../strategy/jwt.strategy';

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
