import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { loginUsuario } from './dto/login.user';
import { registroUsuario } from './dto/register.user';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from './enums/role.enum';


@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async create(registroDto: registroUsuario) {
    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { email: registroDto.email },
    });

    if (usuarioExistente) {
      throw new ConflictException('El correo ya está registrado');
    }
    const contraseñaHasheada = await bcrypt.hash(registroDto.contraseña, 10);

    const nuevoUsuario = await this.prisma.usuario.create({
      data: {
        email: registroDto.email,
        contraseña: contraseñaHasheada,
        nombre: registroDto.nombre,
        apellido: registroDto.apellido,
        semestre: registroDto.semestre,
        telefono: registroDto.telefono,
        rol: registroDto.email.endsWith('@mail.escuelaing.edu.co') ? Role.ESTUDIANTE : Role.TUTOR,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        createdAt: true,
        semestre: true,
        telefono: true,
      },
    });

    //TODO:
    //debemos enviar un mensaje asincrono al microservico de gestioin de usuarios, para crear el perfil del usuario

    return {
      mensaje: 'Usuario registrado exitosamente',
      usuario: nuevoUsuario,
    };
  }

  async login(loginUsuario: loginUsuario) {
    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { email: loginUsuario.email },
    });

    if (!usuarioExistente) {
      throw new ConflictException('El usuario no fue encontrado.');
    }

    // Verificar si la cuenta está bloqueada
    if (usuarioExistente.bloqueado_hasta && usuarioExistente.bloqueado_hasta > new Date()) {
      const tiempoRestante = Math.ceil((usuarioExistente.bloqueado_hasta.getTime() - Date.now()) / 60000);
      throw new ConflictException(`Cuenta bloqueada. Intente nuevamente en ${tiempoRestante} minutos.`);
    }

    const contraseñaValida = await bcrypt.compare(
      loginUsuario.contraseña,
      usuarioExistente.contraseña,
    );

    if (!contraseñaValida) {
      const nuevosIntentos = usuarioExistente.intentos_fallidos + 1;

      if (nuevosIntentos >= 5) {
        await this.prisma.usuario.update({
          where: { id: usuarioExistente.id },
          data: {
            intentos_fallidos: nuevosIntentos,
            bloqueado_hasta: new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
          },
        });
        throw new ConflictException('Cuenta bloqueada por múltiples intentos fallidos. Intente en 30 minutos.');
      }

      // Incrementar intentos fallidos
      await this.prisma.usuario.update({
        where: { id: usuarioExistente.id },
        data: { intentos_fallidos: nuevosIntentos },
      });

      const intentosRestantes = 5 - nuevosIntentos;
      throw new ConflictException(`Credenciales incorrectas. Le quedan ${intentosRestantes} intentos.`);
    }

    await this.prisma.usuario.update({
      where: { id: usuarioExistente.id },
      data: {
        intentos_fallidos: 0,
        bloqueado_hasta: null, // Importante: limpiar el bloqueo, dejarlo null está bien.
        ultimo_login: new Date()
      },
    });

    // Crear el payload del token, lo que lleva adentro
    const payload = {
      sub: usuarioExistente.id,
      email: usuarioExistente.email,
      rol: usuarioExistente.rol,
    };

    // Generar el token JWT
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      mensaje: 'Login exitoso',
      accessToken,
      usuario: {
        id: usuarioExistente.id,
        email: usuarioExistente.email,
        nombre: usuarioExistente.nombre,
        apellido: usuarioExistente.apellido,
        rol: usuarioExistente.rol,
      },
      metadata: {
        issuedAt: Date.now(),
        expiresIn: this.jwtService.decode(accessToken)['exp'] * 1000,
      },
    };
  }
}
