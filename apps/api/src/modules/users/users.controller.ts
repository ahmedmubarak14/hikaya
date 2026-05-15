import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { type AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async me(@CurrentUser() user: AuthenticatedUser) {
    const found = await this.users.findById(user.id);
    if (!found) throw new NotFoundException();
    return {
      id: found.id,
      email: found.email,
      displayName: found.displayName,
      roles: found.roles,
      activeRole: found.activeRole,
      locale: found.locale,
      avatarUrl: found.avatarUrl,
    };
  }
}
