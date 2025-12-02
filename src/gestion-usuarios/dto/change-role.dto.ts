import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeRoleDto {
  @ApiProperty({
    description: 'ID del rol a asignar al usuario',
    example: 2,
    enum: [1, 2, 3],
    enumName: 'RoleIds',
    type: Number,
    minimum: 1,
  })
    @IsInt({ message: 'El rolId debe ser un número entero' })
    @IsPositive({ message: 'El rolId debe ser un número positivo' })
    @Type(() => Number)
    rolId: number;

}
