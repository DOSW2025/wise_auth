import { IsString, IsNotEmpty, IsEmail, IsUUID, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UserResponseDto {
  @IsUUID()
  id: string;

  @IsEmail()
  email: string;

  @IsString()
  nombre: string;

  @IsString()
  apellido: string;

  @IsString()
  rol: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;
}

export class AuthResponseDto {
  @IsString()
  @IsNotEmpty()
  access_token: string;

  @ValidateNested()
  @Type(() => UserResponseDto)
  user: UserResponseDto;
}
