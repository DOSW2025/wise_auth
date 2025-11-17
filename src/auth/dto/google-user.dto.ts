import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleUserDto {
  @ApiProperty({
    description: 'ID único del usuario en Google',
    example: '1234567890',
  })
  @IsNotEmpty({ message: 'El Google ID es requerido.' })
  @IsString({ message: 'El Google ID debe ser un string.' })
  googleId: string;

  @ApiProperty({
    description: 'Email del usuario obtenido de Google',
    example: 'usuario@gmail.com',
  })
  @IsNotEmpty({ message: 'El email es requerido.' })
  @IsEmail({}, { message: 'El correo debe tener un formato válido.' })
  email: string;

  @ApiProperty({
    description: 'Nombre del usuario obtenido de Google',
    example: 'Juan',
  })
  @IsNotEmpty({ message: 'El nombre es requerido.' })
  @IsString({ message: 'El nombre debe ser un string.' })
  nombre: string;

  @ApiProperty({
    description: 'Apellido del usuario obtenido de Google',
    example: 'Pérez',
  })
  @IsNotEmpty({ message: 'El apellido es requerido.' })
  @IsString({ message: 'El apellido debe ser un string.' })
  apellido: string;

  @ApiProperty({
    description: 'URL del avatar del usuario en Google',
    example: 'https://lh3.googleusercontent.com/a/ACg8ocIZjAbC...',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El avatar URL debe ser un string.' })
  avatarUrl?: string;
}
