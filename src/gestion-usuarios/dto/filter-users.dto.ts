import { Type } from 'class-transformer';
import { IsOptional, IsString, IsPositive, Min, IsInt } from 'class-validator';

export class FilterUsersDto {
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  limit: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  rolId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  estadoId?: number;
}
