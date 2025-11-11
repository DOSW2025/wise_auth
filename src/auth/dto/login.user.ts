import { IsEmail, IsNotEmpty, IsString, Matches} from "class-validator";

export class loginUsuario {
    @IsNotEmpty()
    @IsEmail({}, { message: 'El correo debe tener un formato válido.' })
    @Matches(/^[\w.-]+@(mail\.)?escuelaing\.edu\.co$/, {
        message: 'El correo debe ser institucional',
    })
    @IsNotEmpty({message: 'Existen campos sin información necesaria.'})
    email: string;
    @IsNotEmpty()
    @IsString()
    contraseña:string;
}
