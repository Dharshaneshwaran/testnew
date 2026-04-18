import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('pending')
  listPending() {
    return this.usersService.listPendingApproval();
  }

  @Patch(':id/approve')
  approve(@Param('id') userId: string) {
    return this.usersService.approveUser(userId);
  }
}

