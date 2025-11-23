import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeStatusDto {
  @ApiProperty({
    description: 'ID del estado a asignar al usuario. Valores válidos: 1 (activo), 2 (inactivo), 3 (suspendido)',
    example: 1,
    type: Number,
    minimum: 1,
    enum: [1, 2, 3],
  })
  @IsInt({ message: 'El ID del estado debe ser un número entero' })
  @IsPositive({ message: 'El ID del estado debe ser positivo' })
  @Type(() => Number)
  estadoId: number;
}
