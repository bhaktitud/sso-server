import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '@src/user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { MailModule } from '@src/mail/mail.module';
import { PrismaModule } from '@src/prisma/prisma.module';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

@Module({
  imports: [
    UserModule,
    PassportModule,
    MailModule,
    PrismaModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: () => {
        let privateKey: string;
        let publicKey: string;
        try {
          const privateKeyPath = jwtConstants.access.privateKeyPath;
          const publicKeyPath = jwtConstants.access.publicKeyPath;
          privateKey = fs.readFileSync(privateKeyPath, 'utf8');
          publicKey = fs.readFileSync(publicKeyPath, 'utf8');
        } catch (error: unknown) {
          console.error('Error reading JWT keys:', error);
          const message =
            error instanceof Error ? error.message : String(error);
          throw new Error(
            `Could not read JWT keys. Ensure keys exist at specified paths. Original error: ${message}`,
          );
        }

        return {
          privateKey,
          publicKey,
          signOptions: {
            expiresIn: jwtConstants.access.expiresIn,
            algorithm: jwtConstants.access.algorithm,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, RefreshTokenStrategy],
})
export class AuthModule {}
