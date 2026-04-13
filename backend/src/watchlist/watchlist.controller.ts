import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWatchlistFolderDto } from './dto/create-watchlist-folder.dto';
import { CreateWatchlistItemDto } from './dto/create-watchlist-item.dto';
import { WatchlistService } from './watchlist.service';

@UseGuards(JwtAuthGuard)
@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post('folders')
  createFolder(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateWatchlistFolderDto,
  ) {
    return this.watchlistService.createFolder(user.id, dto);
  }

  @Get('folders')
  getFolders(@CurrentUser() user: { id: string }) {
    return this.watchlistService.getFolders(user.id);
  }

  @Post('items')
  createItem(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateWatchlistItemDto,
  ) {
    return this.watchlistService.createItem(user.id, dto);
  }

  @Get('items/:folderId')
  getItems(
    @CurrentUser() user: { id: string },
    @Param('folderId') folderId: string,
  ) {
    return this.watchlistService.getItemsByFolder(user.id, folderId);
  }

  @Delete('items/:id')
  deleteItem(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.watchlistService.deleteItem(user.id, id);
  }

  @Post('items/remove')
  removeItem(
    @CurrentUser() user: { id: string },
    @Body() dto: { folderId: string; symbol: string },
  ) {
    return this.watchlistService.removeItemBySymbol(
      user.id,
      dto.folderId,
      dto.symbol,
    );
  }

  @Delete('folders/:id')
  deleteFolder(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.watchlistService.deleteFolder(user.id, id);
  }

  @Delete('folders')
  deleteAllFolders(@CurrentUser() user: { id: string }) {
    return this.watchlistService.deleteAllFolders(user.id);
  }
}
