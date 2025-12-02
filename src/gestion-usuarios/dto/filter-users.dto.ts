import { Type } from 'class-transformer';
import { IsOptional, IsString, IsPositive, Min, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterUsersDto {
  @ApiPropertyOptional({
    description: 'Número de página para la paginación',
    example: 1,
    default: 1,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @IsPositive({ message: 'La página debe ser un número positivo' })
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de resultados por página',
    example: 10,
    default: 10,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @IsPositive({ message: 'El límite debe ser un número positivo' })
  @Min(1, { message: 'El límite debe ser al menos 1' })
  @Type(() => Number)
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Término de búsqueda para filtrar por nombre, apellido o email',
    example: 'Juan',
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser un texto' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de rol (1=estudiante, 2=tutor, 3=admin)',
    example: 1,
    enum: [1, 2, 3],
    type: Number,
  })
  @IsOptional()
  @IsInt({ message: 'El rolId debe ser un número entero' })
  @IsPositive({ message: 'El rolId debe ser un número positivo' })
  @Type(() => Number)
  rolId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de estado (1=activo, 2=inactivo, 3=suspendido, 4=pendiente)',
    example: 1,
    enum: [1, 2, 3, 4],
    type: Number,
  })
  @IsOptional()
  @IsInt({ message: 'El estadoId debe ser un número entero' })
  @IsPositive({ message: 'El estadoId debe ser un número positivo' })
  @Type(() => Number)
  estadoId?: number;
}
