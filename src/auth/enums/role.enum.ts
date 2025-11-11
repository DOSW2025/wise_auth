export enum Role {
  ESTUDIANTE = 'estudiante',
  TUTOR = 'tutor',
  ADMIN = 'admin',
}

export enum EstadoUsuario {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  SUSPENDIDO = 'suspendido',
  PENDIENTE = 'pendiente_activacion',
}

export enum TipoToken {
  ACTIVACION = 'activacion',
  RECUPERACION = 'recuperacion_password',
  VERIFICACION2FA = 'verificacion_2fa',
}
