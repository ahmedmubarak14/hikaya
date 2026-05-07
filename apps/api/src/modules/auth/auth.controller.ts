import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { SignInDto, SignUpDto } from './auth.dto';
import { AuthService, type AuthResult } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('sign-up')
  signUp(@Body() dto: SignUpDto): Promise<AuthResult> {
    return this.auth.signUp(dto);
  }

  @Post('sign-in')
  signIn(@Body() dto: SignInDto): Promise<AuthResult> {
    return this.auth.signIn(dto);
  }
}
