import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class ChangeRoleDto {
  @ApiProperty({
    description: 'ID del rol a asignar al usuario. Valores válidos: 1 (estudiante), 2 (tutor), 3 (admin)',
    example: 2,
    type: Number,
    minimum: 1,
    enum: [1, 2, 3],
  })
  @IsInt({ message: 'El ID del rol debe ser un número entero' })
  @IsPositive({ message: 'El ID del rol debe ser positivo' })
  @Type(() => Number)
  rolId: number;

}
