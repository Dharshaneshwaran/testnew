import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateWatchlistItemDto {
  @IsUUID()
  folderId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(32)
  symbol!: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  exchange?: string;
}
