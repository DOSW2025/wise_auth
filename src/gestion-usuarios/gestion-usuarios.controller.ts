import { Controller, Get, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { GestionUsuariosService } from './gestion-usuarios.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ChangeRoleDto, ChangeStatusDto, UpdatePersonalInfoDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Gestión de Usuarios')
@Controller('gestion-usuarios')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GestionUsuariosController {
  constructor(private readonly gestionUsuariosService: GestionUsuariosService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Listar todos los usuarios con paginación',
    description:
      'Obtiene una lista paginada de todos los usuarios del sistema. Incluye información de rol y estado de cada usuario.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página (por defecto: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Cantidad de resultados por página (por defecto: 10)', example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '9b1deb3d-3b7d-4bad-9bdd-2b0d70cf0d28' },
              email: { type: 'string', example: 'usuario@example.com' },
              nombre: { type: 'string', example: 'Juan' },
              apellido: { type: 'string', example: 'Pérez' },
              telefono: { type: 'string', example: '+57 300 123 4567', nullable: true },
              semestre: { type: 'number', example: 5 },
              google_id: { type: 'string', example: '1234567890', nullable: true },
              avatar_url: { type: 'string', example: 'https://example.com/avatar.jpg', nullable: true },
              rol: {
                type: 'object',
                properties: { id: { type: 'number', example: 1 }, nombre: { type: 'string', example: 'estudiante' } },
              },
              estado: {
                type: 'object',
                properties: { id: { type: 'number', example: 1 }, nombre: { type: 'string', example: 'activo' } },
              },
              createdAt: { type: 'string', format: 'date-time', example: '2025-01-15T10:30:00Z' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 100 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            totalPages: { type: 'number', example: 10 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Parámetros de paginación inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT inválido o faltante' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tiene permisos de administrador' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.gestionUsuariosService.findAllPaginated(paginationDto);
  }

  @Patch(':id/rol')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cambiar rol de un usuario', description: 'Permite cambiar el rol de un usuario específico. Los roles disponibles son: estudiante (1), tutor (2), admin (3).' })
  @ApiParam({ name: 'id', type: 'string', description: 'UUID del usuario', example: '9b1deb3d-3b7d-4bad-9bdd-2b0d70cf0d28' })
  @ApiResponse({
    status: 200,
    description: 'Rol actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '9b1deb3d-3b7d-4bad-9bdd-2b0d70cf0d28' },
        email: { type: 'string', example: 'usuario@example.com' },
        nombre: { type: 'string', example: 'Juan' },
        apellido: { type: 'string', example: 'Pérez' },
        rol: { type: 'object', properties: { id: { type: 'number', example: 2 }, nombre: { type: 'string', example: 'tutor' } } },
        estado: { type: 'object', properties: { id: { type: 'number', example: 1 }, nombre: { type: 'string', example: 'activo' } } },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'ID de rol inválido' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado o rol no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT inválido o faltante' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tiene permisos de administrador' })
  changeRole(@Param('id') id: string, @Body() changeRoleDto: ChangeRoleDto) {
    return this.gestionUsuariosService.changeRole(id, changeRoleDto);
  }

  @Patch(':id/estado')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cambiar estado de un usuario', description: 'Permite cambiar el estado de un usuario específico. Los estados disponibles son: activo (1), inactivo (2), suspendido (3).' })
  @ApiParam({ name: 'id', type: 'string', description: 'UUID del usuario', example: '9b1deb3d-3b7d-4bad-9bdd-2b0d70cf0d28' })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '9b1deb3d-3b7d-4bad-9bdd-2b0d70cf0d28' },
        email: { type: 'string', example: 'usuario@example.com' },
        nombre: { type: 'string', example: 'Juan' },
        apellido: { type: 'string', example: 'Pérez' },
        rol: { type: 'object', properties: { id: { type: 'number', example: 1 }, nombre: { type: 'string', example: 'estudiante' } } },
        estado: { type: 'object', properties: { id: { type: 'number', example: 3 }, nombre: { type: 'string', example: 'suspendido' } } },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'ID de estado inválido' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado o estado no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT inválido o faltante' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tiene permisos de administrador' })
  changeStatus(@Param('id') id: string, @Body() changeStatusDto: ChangeStatusDto) {
    return this.gestionUsuariosService.changeStatus(id, changeStatusDto);
  }

  @Patch('me/info-personal')
  updateMyPersonalInfo(@GetUser('id') userId: string, @Body() updatePersonalInfoDto: UpdatePersonalInfoDto) {
    return this.gestionUsuariosService.updatePersonalInfo(userId, updatePersonalInfoDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  deleteUserByAdmin(@Param('id') id: string) {
    return this.gestionUsuariosService.deleteUser(id);
  }

  @Delete('me/cuenta')
  deleteMyAccount(@GetUser('id') userId: string) {
    return this.gestionUsuariosService.deleteUser(userId);
  }
}