import { IsEmail, IsString } from "class-validator";

export enum TemplateNotificacionesEnum {
    NUEVO_USUARIO = "nuevoUsuario"
}
export class NotificacionesDto {
    @IsEmail()
    "email": string;
    @IsString()
    "name": string;
    "id": string;
    "template": TemplateNotificacionesEnum.NUEVO_USUARIO;
}

