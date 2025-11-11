import { Type } from "class-transformer";
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Matches,MinLength } from "class-validator";

export class registroUsuario {
    @IsNotEmpty({message: 'Existen campos sin información necesaria.'})
    @IsString({ message: 'El nombre debe ser un String.' })
    nombre: string;
    @IsString({ message: 'El apellido debe ser un String.' })
    @IsNotEmpty({message: 'Existen campos sin información necesaria.'})
    apellido: string;
    @IsEmail({}, { message: 'El correo debe tener un formato válido.' })
    @Matches(/^[\w.-]+@(mail\.)?escuelaing\.edu\.co$/, {
        message: 'El correo debe ser institucional',
    })
    @IsNotEmpty({message: 'Existen campos sin información necesaria.'})
    email: string;
    @IsNumber()
    @IsPositive()
    @IsOptional()
    @Type(() => Number)
    semestre?: number;
    @IsString()
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).+$/, {
        message:
            'La contraseña debe contener al menos una letra minúscula, una mayúscula y un carácter especial.',
    })
    @IsNotEmpty({message: 'Existen campos sin información necesaria.'})
    contraseña: string;
    @Type(() => String)
    @IsOptional()
    telefono?: string;
}
