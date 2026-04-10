import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateAlertDto) {
    return this.prisma.alert.create({
      data: {
        userId,
        symbol: dto.symbol.toUpperCase(),
        condition: dto.condition,
        targetPrice: new Prisma.Decimal(dto.targetPrice),
        isActive: dto.isActive ?? true,
      },
    });
  }

  getAll(userId: string) {
    return this.prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggle(userId: string, alertId: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { id: alertId },
    });
    if (!alert) {
      throw new NotFoundException('Alert not found');
    }
    if (alert.userId !== userId) {
      throw new ForbiddenException('Cannot update this alert');
    }

    return this.prisma.alert.update({
      where: { id: alertId },
      data: {
        isActive: !alert.isActive,
      },
    });
  }
}
