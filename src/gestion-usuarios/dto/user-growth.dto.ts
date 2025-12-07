import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UserGrowthDto {
  @ApiProperty({
    description: 'Número de semanas a mostrar en el gráfico de crecimiento',
    example: 12,
    required: false,
    minimum: 1,
    maximum: 52,
    default: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'El número de semanas debe ser al menos 1' })
  @Max(52, { message: 'El número de semanas no puede exceder 52 (1 año)' })
  weeks?: number = 12;
}
