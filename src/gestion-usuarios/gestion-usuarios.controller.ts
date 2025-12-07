import { Controller, Get, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { GestionUsuariosService } from './gestion-usuarios.service';
import { ChangeRoleDto, ChangeStatusDto, UpdatePersonalInfoDto, FilterUsersDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Public } from 'src/auth';


@ApiTags('gestion-usuarios')
@ApiBearerAuth('JWT-auth')
@Controller('gestion-usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GestionUsuariosController {
  constructor(private readonly gestionUsuariosService: GestionUsuariosService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Listar todos los usuarios con filtros',
    description: 'Obtiene una lista paginada de usuarios con opciones de filtrado por búsqueda, rol y estado. Solo accesible por administradores.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (por defecto: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de resultados por página (por defecto: 10)',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Buscar por nombre, apellido o email',
    example: 'Juan',
  })
  @ApiQuery({
    name: 'rolId',
    required: false,
    type: Number,
    description: 'Filtrar por ID de rol (1=estudiante, 2=tutor, 3=admin)',
    example: 1,
  })
  @ApiQuery({
    name: 'estadoId',
    required: false,
    type: Number,
    description: 'Filtrar por ID de estado (1=activo, 2=inactivo, 3=suspendido, 4=pendiente)',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente',
    schema: {
      example: {
        data: [
          {
            id: '9b1deb3d-3b7d-4bad-9bdd-2b0d70cf0d28',
            email: 'usuario@example.com',
            nombre: 'Juan',
            apellido: 'Pérez',
            rol: 'estudiante',
            estado: 'activo',
            avatarUrl: 'https://lh3.googleusercontent.com/a/ACg8ocIZjAbC...',
            createdAt: '2024-01-15T10:30:00Z',
          },
        ],
        meta: {
          total: 100,
          page: 1,
          limit: 10,
          totalPages: 10,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT inválido o expirado',
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - No tienes permisos de administrador',
  })
  findAll(@Query() filterUsersDto: FilterUsersDto) {
    return this.gestionUsuariosService.findAllWithFilters(filterUsersDto);
  }

  @Patch(':id/rol')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Cambiar el rol de un usuario',
    description: 'Permite a un administrador cambiar el rol de cualquier usuario. Los roles disponibles son: estudiante (1), tutor (2), admin (3).',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del usuario',
    example: '9b1deb3d-3b7d-4bad-9bdd-2b0d70cf0d28',
  })
  @ApiResponse({
    status: 200,
    description: 'Rol actualizado exitosamente',
    schema: {
      example: {
        id: '9b1deb3d-3b7d-4bad-9bdd-2b0d70cf0d28',
        email: 'usuario@example.com',
        nombre: 'Juan',
        apellido: 'Pérez',
        rol: 'tutor',
        mensaje: 'Rol actualizado correctamente',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos - El rolId debe ser un número positivo válido',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT inválido o expirado',
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - No tienes permisos de administrador',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  changeRole(@Param('id') id: string, @Body() changeRoleDto: ChangeRoleDto) {
    return this.gestionUsuariosService.changeRole(id, changeRoleDto);
  }

  @Patch(':id/estado')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Cambiar el estado de un usuario',
    description: 'Permite a un administrador cambiar el estado de cualquier usuario. Los estados disponibles son: activo (1), inactivo (2), suspendido (3), pendiente (4).',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del usuario',
    example: '9b1deb3d-3b7d-4bad-9bdd-2b0d70cf0d28',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado exitosamente',
    schema: {
      example: {
        id: '9b1deb3d-3b7d-4bad-9bdd-2b0d70cf0d28',
        email: 'usuario@example.com',
        nombre: 'Juan',
        apellido: 'Pérez',
        estado: 'suspendido',
        mensaje: 'Estado actualizado correctamente',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos - El estadoId debe ser un número positivo válido',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT inválido o expirado',
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - No tienes permisos de administrador',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  changeStatus(@Param('id') id: string, @Body() changeStatusDto: ChangeStatusDto) {
    return this.gestionUsuariosService.changeStatus(id, changeStatusDto);
  }

  @Patch('me/info-personal')
  @ApiOperation({
    summary: 'Actualizar mi información personal',
    description: 'Permite a cualquier usuario autenticado actualizar su propia información personal (teléfono y biografía).',
  })
  @ApiResponse({
    status: 200,
    description: 'Información personal actualizada exitosamente',
    schema: {
      example: {
        id: '9b1deb3d-3b7d-4bad-9bdd-2b0d70cf0d28',
        email: 'usuario@example.com',
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+57 300 123 4567',
        biografia: 'Estudiante de ingeniería de sistemas apasionado por la tecnología',
        mensaje: 'Información personal actualizada correctamente',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos - Verifica que el teléfono no exceda 20 caracteres y la biografía no exceda 500 caracteres',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT inválido o expirado',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  updateMyPersonalInfo(
    @GetUser('id') userId: string,
    @Body() updatePersonalInfoDto: UpdatePersonalInfoDto,
  ) {
    return this.gestionUsuariosService.updatePersonalInfo(userId, updatePersonalInfoDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Eliminar un usuario (admin)',
    description: 'Permite a un administrador eliminar cualquier usuario del sistema. Esta operación es irreversible.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del usuario a eliminar',
    example: '9b1deb3d-3b7d-4bad-9bdd-2b0d70cf0d28',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario eliminado exitosamente',
    schema: {
      example: {
        mensaje: 'Usuario eliminado correctamente',
        id: '9b1deb3d-3b7d-4bad-9bdd-2b0d70cf0d28',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT inválido o expirado',
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - No tienes permisos de administrador',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  deleteUserByAdmin(@Param('id') id: string) {
    return this.gestionUsuariosService.deleteUser(id);
  }

  @Delete('me/cuenta')
  @ApiOperation({
    summary: 'Eliminar mi propia cuenta',
    description: 'Permite a cualquier usuario autenticado eliminar su propia cuenta. Esta operación es irreversible.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cuenta eliminada exitosamente',
    schema: {
      example: {
        mensaje: 'Tu cuenta ha sido eliminada correctamente',
        id: '9b1deb3d-3b7d-4bad-9bdd-2b0d70cf0d28',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT inválido o expirado',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  deleteMyAccount(@GetUser('id') userId: string) {
    return this.gestionUsuariosService.deleteUser(userId);
  }

  @Get('estadisticas/usuarios')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Obtener estadísticas de usuarios',
    description: 'Obtiene un informe completo con el conteo y porcentaje de usuarios activos, suspendidos e inactivos. Solo accesible por administradores.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      example: {
        resumen: {
          total: 100,
          activos: {
            conteo: 75,
            porcentaje: 75.00
          },
          suspendidos: {
            conteo: 15,
            porcentaje: 15.00
          },
          inactivos: {
            conteo: 10,
            porcentaje: 10.00
          }
        },
        usuarios: {
          activos: [
            {
              id: '9b1deb3d-3b7d-4bad-9bdd-2b0d70cf0d28',
              nombre: 'Juan',
              apellido: 'Pérez',
              email: 'juan@example.com'
            }
          ],
          suspendidos: [
            {
              id: '8a2cdb2c-2a6c-3aac-8acc-1a0c60bc0c17',
              nombre: 'María',
              apellido: 'García',
              email: 'maria@example.com'
            }
          ],
          inactivos: [
            {
              id: '7b3dea1b-1b5b-2bba-7bbb-0b1b50ab0b06',
              nombre: 'Carlos',
              apellido: 'López',
              email: 'carlos@example.com'
            }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT inválido o expirado',
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - No tienes permisos de administrador',
  })
  stadisticUsers() {
    return this.gestionUsuariosService.stadisticUsers();
  }

  @Get('estadisticas/roles')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Obtener estadísticas de usuarios por rol',
    description: 'Obtiene el total de usuarios y cuántos usuarios tienen cada rol (estudiante, tutor, admin). Solo accesible por administradores.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas por rol obtenidas exitosamente',
    schema: {
      example: {
        totalUsuarios: 100,
        roles: [
          {
            rolId: 1,
            rol: 'estudiante',
            conteo: 75,
            porcentaje: 75.00
          },
          {
            rolId: 2,
            rol: 'tutor',
            conteo: 20,
            porcentaje: 20.00
          },
          {
            rolId: 3,
            rol: 'admin',
            conteo: 5,
            porcentaje: 5.00
          }
        ]
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT inválido o expirado',
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - No tienes permisos de administrador',
  })
  getUsersByRoleStatistics() {
    return this.gestionUsuariosService.getUsersByRoleStatistics();
  }

}