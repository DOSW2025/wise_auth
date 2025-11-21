import { IsString, IsNotEmpty, IsEmail, IsUUID, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'ID único del usuario (UUID)',
    example: '9b1deb3d-3b7d-4bad-9bdd-2b0d70cf0d28',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
  })
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Pérez',
  })
  @IsString()
  apellido: string;

  @ApiProperty({
    description: 'Rol del usuario en el sistema',
    example: 'estudiante',
    enum: ['estudiante', 'tutor', 'admin'],
  })
  @IsString()
  rol: string;

  @ApiProperty({
    description: 'URL del avatar del usuario (obtenido de Google)',
    example: 'https://lh3.googleusercontent.com/a/ACg8ocIZjAbC...',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Token JWT para autenticación en requests subsecuentes',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YjFkZWIzZC0zYjdkLTRiYWQtOWJkZC0yYjBkNzBjZjBkMjgiLCJlbWFpbCI6InVzdWFyaW9AZXhhbXBsZS5jb20iLCJyb2xlIjoiZXN0dWRpYW50ZSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwNjA0ODAwfQ.abcdefghijklmnopqrstuvwxyz',
  })
  @IsString()
  @IsNotEmpty()
  access_token: string;

  @ApiProperty({
    description: 'Información del usuario autenticado',
    type: UserResponseDto,
  })
  @ValidateNested()
  @Type(() => UserResponseDto)
  user: UserResponseDto;
}
