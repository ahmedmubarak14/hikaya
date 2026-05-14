import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type User, UserRole } from '@hikaya/database';
import * as argon2 from 'argon2';

import { PrismaService } from '../../common/prisma/prisma.service';

import type { SignInDto, SignUpDto } from './auth.dto';

export interface AuthResult {
  accessToken: string;
  user: Pick<User, 'id' | 'email' | 'displayName' | 'roles' | 'activeRole' | 'locale' | 'avatarUrl'>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signUp(dto: SignUpDto): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new UnauthorizedException('Email already in use');

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
        locale: dto.locale === 'ar' ? 'AR' : 'EN',
        roles: [dto.role ?? UserRole.CLIENT],
        activeRole: dto.role ?? UserRole.CLIENT,
      },
    });

    return this.issue(user);
  }

  async signIn(dto: SignInDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.issue(user);
  }

  private issue(user: User): AuthResult {
    const accessToken = this.jwt.sign({ sub: user.id, roles: user.roles });
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        roles: user.roles,
        activeRole: user.activeRole,
        locale: user.locale,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
