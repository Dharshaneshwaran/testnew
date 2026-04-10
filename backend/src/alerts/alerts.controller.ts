import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateAlertDto } from './dto/create-alert.dto';
import { AlertsService } from './alerts.service';

@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateAlertDto) {
    return this.alertsService.create(user.id, dto);
  }

  @Get()
  getAll(@CurrentUser() user: { id: string }) {
    return this.alertsService.getAll(user.id);
  }

  @Patch(':id/toggle')
  toggle(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.alertsService.toggle(user.id, id);
  }
}
