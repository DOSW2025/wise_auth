import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class ChangeStatusDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  estadoId: number;
}
