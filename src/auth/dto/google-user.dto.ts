import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class GoogleUserDto {
  @IsNotEmpty({ message: 'El Google ID es requerido.' })
  @IsString({ message: 'El Google ID debe ser un string.' })
  googleId: string;

  @IsNotEmpty({ message: 'El email es requerido.' })
  @IsEmail({}, { message: 'El correo debe tener un formato válido.' })
  email: string;

  @IsNotEmpty({ message: 'El nombre es requerido.' })
  @IsString({ message: 'El nombre debe ser un string.' })
  nombre: string;

  @IsNotEmpty({ message: 'El apellido es requerido.' })
  @IsString({ message: 'El apellido debe ser un string.' })
  apellido: string;

  @IsOptional()
  @IsString({ message: 'El avatar URL debe ser un string.' })
  avatarUrl?: string;
}
