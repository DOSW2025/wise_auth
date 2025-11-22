import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePersonalInfoDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  biografia?: string;
}
