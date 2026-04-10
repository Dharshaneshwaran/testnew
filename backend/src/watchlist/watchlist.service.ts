import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateWatchlistFolderDto } from './dto/create-watchlist-folder.dto';
import { CreateWatchlistItemDto } from './dto/create-watchlist-item.dto';

@Injectable()
export class WatchlistService {
  constructor(private readonly prisma: PrismaService) {}

  createFolder(userId: string, dto: CreateWatchlistFolderDto) {
    return this.prisma.watchlistFolder.create({
      data: {
        userId,
        name: dto.name,
      },
      include: {
        items: true,
      },
    });
  }

  getFolders(userId: string) {
    return this.prisma.watchlistFolder.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createItem(userId: string, dto: CreateWatchlistItemDto) {
    const folder = await this.prisma.watchlistFolder.findUnique({
      where: { id: dto.folderId },
    });

    if (!folder) {
      throw new NotFoundException('Watchlist folder not found');
    }

    if (folder.userId !== userId) {
      throw new ForbiddenException('Cannot add item to this folder');
    }

    return this.prisma.watchlistItem.create({
      data: {
        folderId: dto.folderId,
        symbol: dto.symbol.toUpperCase(),
        exchange: dto.exchange?.toUpperCase(),
      },
    });
  }

  async getItemsByFolder(userId: string, folderId: string) {
    const folder = await this.prisma.watchlistFolder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw new NotFoundException('Watchlist folder not found');
    }

    if (folder.userId !== userId) {
      throw new ForbiddenException('Cannot access this folder');
    }

    return this.prisma.watchlistItem.findMany({
      where: { folderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteItem(userId: string, itemId: string) {
    const item = await this.prisma.watchlistItem.findUnique({
      where: { id: itemId },
      include: { folder: true },
    });

    if (!item) {
      throw new NotFoundException('Watchlist item not found');
    }

    if (item.folder.userId !== userId) {
      throw new ForbiddenException('Cannot delete this watchlist item');
    }

    await this.prisma.watchlistItem.delete({ where: { id: itemId } });
    return { success: true };
  }
}
