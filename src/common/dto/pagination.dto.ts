import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({

    description: 'Cantidad de elementos por página',
    example: 10,
    default: 10,
    minimum: 1,
    type: Number,

  })
  @IsOptional()
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  limit: number = 10;
}
