import { IsBoolean, IsEmail, IsString } from "class-validator";

export enum TemplateNotificacionesEnum {
    NUEVO_USUARIO = "nuevoUsuario"
}
export class NotificacionesDto {
    @IsEmail()
    email: string;
    @IsString()
    name: string;
    template: TemplateNotificacionesEnum.NUEVO_USUARIO;
    @IsString()
    resumen: string = "nuevo usuario bienvenido";
    @IsBoolean()
    guardar: boolean = true;
}
