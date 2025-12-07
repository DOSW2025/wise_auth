import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Controller, Get, Req, Res, UseGuards, Logger, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleUserDto } from './dto/google-user.dto';
import { envs } from 'src/config';

interface RequestWithGoogleUser extends Request {
  user: GoogleUserDto;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) { }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Iniciar autenticación con Google OAuth 2.0',
    description: `
      Inicia el flujo de autenticación OAuth 2.0 con Google. Este endpoint redirige automáticamente 
      al usuario a la página de consentimiento de Google donde debe:
      
      1. Seleccionar su cuenta de Google
      2. Autorizar el acceso a su información de perfil (nombre, email, foto)
      3. Será redirigido automáticamente al endpoint de callback
      
      **Nota:** Este endpoint NO se puede probar directamente desde Swagger. 
      Debes acceder a él desde tu navegador copiando la URL completa.
      
      **Ejemplo de uso:**
      \`\`\`
      GET http://localhost:3000/auth/google
      \`\`\`
      
      Después de la autenticación exitosa, el usuario será redirigido al gateway con el token JWT.
    `,
  })
  @ApiResponse({
    status: 302,
    description: 'Redirección exitosa a la página de autenticación de Google OAuth 2.0',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor al iniciar el flujo de autenticación',
    schema: {
      example: {
        statusCode: 500,
        message: 'Error al iniciar autenticación con Google',
        error: 'Internal Server Error',
      },
    },
  })
  async googleAuth() {
    this.logger.log('Iniciando flujo de autenticación con Google');
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Callback de Google OAuth 2.0',
    description: `
      Endpoint que recibe la respuesta de Google después de que el usuario autoriza la aplicación.
      Este endpoint se ejecuta automáticamente después del flujo de OAuth 2.0.
      
      **Flujo del proceso:**
      1. Google redirige al usuario a este endpoint con un código de autorización
      2. El GoogleAuthGuard valida el código y extrae la información del usuario
      3. Se verifica si el usuario existe en la base de datos:
         - Si existe: se actualizan sus datos (nombre, apellido, foto)
         - Si no existe: se crea un nuevo usuario con rol "estudiante" por defecto
      4. Se genera un token JWT con la información del usuario
      5. El usuario es redirigido al gateway con el token y sus datos
      
      **Datos almacenados del usuario:**
      - Google ID (identificador único de Google)
      - Email (verificado por Google)
      - Nombre y apellido
      - URL de foto de perfil
      - Rol asignado (por defecto: estudiante)
      - Estado (por defecto: activo)
      
      **Nota:** Este endpoint tampoco se puede probar directamente desde Swagger.
      Es llamado automáticamente por Google durante el flujo OAuth 2.0.
      
      **Redirección final:**
      El usuario será redirigido a:
      \`\`\`
      {GATEWAY_URL}/wise/auth/callback?token={JWT_TOKEN}&user={USER_DATA}
      \`\`\`
      
      En caso de error:
      \`\`\`
      {GATEWAY_URL}/wise/auth/callback?error={ERROR_MESSAGE}
      \`\`\`
    `,
  })
  @ApiResponse({
    status: 307,
    description: 'Redirección temporal exitosa al gateway con el token JWT y datos del usuario',
    headers: {
      Location: {
        description: 'URL de redirección al gateway con el token y datos del usuario',
        schema: {
          type: 'string',
          example: 'https://gateway.example.com/wise/auth/callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&user={"id":"9b1deb3d...","email":"usuario@gmail.com","nombre":"Juan","apellido":"Pérez","rol":"estudiante"}',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error al procesar la autenticación. Puede ocurrir si los datos de Google son inválidos o incompletos',
    schema: {
      example: {
        error: 'Error al procesar autenticación con Google',
        details: 'Los datos recibidos de Google no son válidos',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No se pudo obtener el email de la cuenta de Google. El email es requerido para el registro',
    schema: {
      example: {
        error: 'No se pudo obtener información del usuario de Google',
        details: 'El email es requerido para completar el registro',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor durante el proceso de autenticación',
    schema: {
      example: {
        error: 'Error al procesar autenticación con Google',
        details: 'Error al validar usuario o generar token JWT',
      },
    },
  })
  async googleAuthCallback(
    @Req() req: RequestWithGoogleUser,
    @Res() res: Response,
  ): Promise<void> {
    try {
      this.logger.log(`Callback de Google recibido`);

      // Verificar si el usuario existe en la request
      if (!req.user) {
        this.logger.error('No se encontró usuario en la request después del guard');
        const errorUrl = `${envs.gatewayUrl}/auth/callback?error=${encodeURIComponent('No se pudo obtener información del usuario de Google')}`;
        res.redirect(HttpStatus.TEMPORARY_REDIRECT, errorUrl);
        return;
      }

      this.logger.log(`Usuario de Google: ${req.user.email}`);

      const googleUserDto = new GoogleUserDto();
      Object.assign(googleUserDto, {
        googleId: req.user.googleId,
        email: req.user.email,
        nombre: req.user.nombre,
        apellido: req.user.apellido,
        avatarUrl: req.user.avatarUrl,
      });

      this.logger.log(`Validando usuario con el servicio de autenticación`);
      const result = await this.authService.validateGoogleUser(googleUserDto);

      this.logger.log(`Autenticación exitosa para: ${req.user.email}`);

      const url = new URL(envs.gatewayUrl);
      let basePath = url.pathname.replace(/\/$/, '');

      // Ensure the path includes the gateway prefix '/wise'
      if (!basePath.endsWith('/wise')) {
        basePath = `${basePath}/wise`;
      }

      url.pathname = `${basePath}/auth/callback`;
      url.searchParams.append('token', result.access_token);
      url.searchParams.append('user', JSON.stringify(result.user));

      const redirectUrl = url.toString();

      this.logger.log(`Redirigiendo a gateway: ${redirectUrl}`);
      res.redirect(HttpStatus.TEMPORARY_REDIRECT, redirectUrl);
    } catch (error) {
      this.logger.error(`Error en callback de Google: ${error.message}`, error.stack);

      const url = new URL(envs.gatewayUrl);
      let basePath = url.pathname.replace(/\/$/, '');

      // Ensure the path includes the gateway prefix '/wise'
      if (!basePath.endsWith('/wise')) {
        basePath = `${basePath}/wise`;
      }

      url.pathname = `${basePath}/auth/callback`;
      url.searchParams.append('error', 'Error al procesar autenticación con Google');

      res.redirect(HttpStatus.TEMPORARY_REDIRECT, url.toString());
    }
  }
}
