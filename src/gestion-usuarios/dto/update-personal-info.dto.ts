import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePersonalInfoDto {
  @ApiPropertyOptional({
    description: 'Número de teléfono del usuario',
    example: '+57 300 123 4567',
    maxLength: 20,
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto' })
  @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Biografía o descripción personal del usuario',
    example: 'Estudiante de ingeniería de sistemas apasionado por la tecnología y la innovación.',
    maxLength: 500,
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'La biografía debe ser un texto' })
  @MaxLength(500, { message: 'La biografía no puede exceder 500 caracteres' })
  biografia?: string;
}
