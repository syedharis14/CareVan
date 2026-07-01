import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  LoginRequest,
  LoginResponse,
  LoginResponseSchema,
  MeResponse,
  MeResponseSchema,
  normalizePkPhone,
} from '@carevan/shared';
import * as argon2 from 'argon2';
import { JwtPayload } from '../common/types';
import { PrismaService } from '../prisma/prisma.service';
import { LoginAttempts } from './login-attempts';

// Verified against when the phone is unknown, so both paths pay the argon2 cost —
// otherwise response timing would reveal which phones exist. The source string can
// never equal a real PIN (PINs are 4–6 digits).
const DUMMY_PIN_HASH = argon2.hash('carevan-timing-dummy');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly loginAttempts: LoginAttempts,
  ) {}

  async login(request: LoginRequest): Promise<LoginResponse> {
    const phone = normalizePkPhone(request.phone);
    this.loginAttempts.assertNotLocked(phone);

    const user = await this.prisma.user.findUnique({ where: { phone } });
    const pinOk = await argon2.verify(user?.pinHash ?? (await DUMMY_PIN_HASH), request.pin);
    if (!user || !pinOk) {
      this.loginAttempts.registerFailure(phone);
      // Same error for unknown phone and wrong PIN — don't leak which phones exist.
      throw new UnauthorizedException('Incorrect phone or PIN');
    }
    this.loginAttempts.clear(phone);

    const payload: JwtPayload = { sub: user.id, phone: user.phone, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return LoginResponseSchema.parse({
      accessToken,
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
    });
  }

  async me(userId: string): Promise<MeResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User no longer exists');
    return MeResponseSchema.parse({
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
    });
  }
}
