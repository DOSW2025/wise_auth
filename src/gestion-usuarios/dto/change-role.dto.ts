import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class ChangeRoleDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  rolId: number;

}
