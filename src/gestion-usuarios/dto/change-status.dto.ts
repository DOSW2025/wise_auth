import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeStatusDto {
  @ApiProperty({
    description: 'ID del estado a asignar al usuario',
    example: 1,
    enum: [1, 2, 3, 4],
    enumName: 'EstadoId',
    type: Number,
    minimum: 1,
  })
  @IsInt({ message: 'El estadoId debe ser un número entero' })
  @IsPositive({ message: 'El estadoId debe ser un número positivo' })
  @Type(() => Number)
  estadoId: number;

}
