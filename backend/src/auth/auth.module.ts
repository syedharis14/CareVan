import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { env } from '../config/env';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginAttempts } from './login-attempts';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: env.JWT_SECRET,
      // 30-day token, no refresh flow in v1 (ADR-0013): drivers/parents must not
      // be asked to re-enter a PIN mid-week; logout simply discards the token.
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LoginAttempts],
})
export class AuthModule {}
