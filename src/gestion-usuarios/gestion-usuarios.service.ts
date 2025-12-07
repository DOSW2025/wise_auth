import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeRoleDto, ChangeStatusDto, UpdatePersonalInfoDto, FilterUsersDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GestionUsuariosService {
  private readonly CACHE_KEY_STATISTICS = 'estadisticas:usuarios';
  private readonly CACHE_KEY_STATISTICS_ROLES = 'estadisticas:usuarios:roles';
  private readonly CACHE_KEY_USERS_PREFIX = 'usuarios:list:';
  private readonly CACHE_KEY_REGISTRY = 'usuarios:cache:registry';

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async invalidateUserCaches() {
    // Invalidar todos los cachés de estadísticas en paralelo
    await Promise.all([
      this.cacheManager.del(this.CACHE_KEY_STATISTICS),
      this.cacheManager.del(this.CACHE_KEY_STATISTICS_ROLES),
    ]);

    // Obtener registro de claves de cache de usuarios
    const registry = await this.cacheManager.get<string[]>(this.CACHE_KEY_REGISTRY) || [];

    // Invalidar todas las claves registradas en paralelo
    if (registry.length > 0) {
      await Promise.all(registry.map(key => this.cacheManager.del(key)));
    }

    // Limpiar el registro
    await this.cacheManager.del(this.CACHE_KEY_REGISTRY);
  }

  async findAllWithFilters(filterUsersDto: FilterUsersDto) {
    const { page, limit, search, rolId, estadoId } = filterUsersDto;

    // Crear clave de cache unica basada en los filtros
    const cacheKey = `usuarios:list:page-${page}:limit-${limit}:search-${search || 'none'}:rol-${rolId || 'none'}:estado-${estadoId || 'none'}`;

    // Intentar obtener del cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * limit;

    // Construir el objeto where dinámicamente basado en los filtros
    const where: Prisma.UsuarioWhereInput = {};

    if (search && search.trim() !== '') {
      where.OR = [
        { nombre: { contains: search.trim(), mode: 'insensitive' } },
        { apellido: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }
    if (rolId) {
      where.rolId = rolId;
    }
    if (estadoId) {
      where.estadoId = estadoId;
    }

    const [usuarios, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        include: {
          rol: { select: { id: true, nombre: true } },
          estado: { select: { id: true, nombre: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    const resultado = usuarios.length === 0
      ? {
          data: [],
          message: 'Sin resultado encontrado',
          meta: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        }
      : {
          data: usuarios,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        };

    // Guardar en cache por 2 minutos (120000 ms) - mas corto que estadisticas
    await this.cacheManager.set(cacheKey, resultado, 120000);

    // Registrar la clave de cache para poder invalidarla despues
    const registry = await this.cacheManager.get<string[]>(this.CACHE_KEY_REGISTRY) || [];
    if (!registry.includes(cacheKey)) {
      registry.push(cacheKey);
      // Guardar el registro con el mismo TTL que las estadisticas (5 minutos)
      await this.cacheManager.set(this.CACHE_KEY_REGISTRY, registry, 300000);
    }

    return resultado;
  }

  async changeRole(userId: string, changeRoleDto: ChangeRoleDto) {
    // Verificar que el rol existe
    const rol = await this.prisma.rol.findUnique({
      where: { id: changeRoleDto.rolId },
    });

    if (!rol) {
      throw new NotFoundException(`Rol con id ${changeRoleDto.rolId} no encontrado`);
    }

    const usuario = await this.prisma.usuario.update({
      where: { id: userId },
      data: { rolId: changeRoleDto.rolId },
      include: {
        rol: { select: { id: true, nombre: true } },
        estado: { select: { id: true, nombre: true } },
      },
    });

    // Invalidar caches relacionados con usuarios
    await this.invalidateUserCaches();

    return usuario;
  }

  async changeStatus(userId: string, changeStatusDto: ChangeStatusDto) {
    // Verificar que el estado existe
    const estado = await this.prisma.estadoUsuario.findUnique({
      where: { id: changeStatusDto.estadoId },
    });

    if (!estado) {
      throw new NotFoundException(`Estado con id ${changeStatusDto.estadoId} no encontrado`);
    }

    const usuario = await this.prisma.usuario.update({
      where: { id: userId },
      data: { estadoId: changeStatusDto.estadoId },
      include: {
        rol: { select: { id: true, nombre: true } },
        estado: { select: { id: true, nombre: true } },
      },
    });

    // Invalidar caches relacionados con usuarios
    await this.invalidateUserCaches();

    return usuario;
  }

  async updatePersonalInfo(userId: string, updatePersonalInfoDto: UpdatePersonalInfoDto) {
    // Verificar que el usuario existe
    const userExists = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      throw new NotFoundException(`Usuario con id ${userId} no encontrado`);
    }

    const usuario = await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        ...(updatePersonalInfoDto.telefono !== undefined && { telefono: updatePersonalInfoDto.telefono }),
        ...(updatePersonalInfoDto.biografia !== undefined && { biografia: updatePersonalInfoDto.biografia }),
      },
      include: {
        rol: { select: { id: true, nombre: true } },
        estado: { select: { id: true, nombre: true } },
      },
    });

    // Invalidar caches relacionados con usuarios
    await this.invalidateUserCaches();

    return usuario;
  }

  async deleteUser(userId: string) {
    // Verificar que el usuario existe
    const userExists = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      throw new NotFoundException(`Usuario con id ${userId} no encontrado`);
    }

    // Eliminar el usuario (las notificaciones se eliminan en cascada gracias a onDelete: Cascade)
    await this.prisma.usuario.delete({
      where: { id: userId },
    });

    // Invalidar caches relacionados con usuarios
    await this.invalidateUserCaches();

    

    return { message: 'Usuario eliminado exitosamente', userId };
  }
  async stadisticUsers() {
    // Intentar obtener del caché
    const cached = await this.cacheManager.get(this.CACHE_KEY_STATISTICS);
    if (cached) {
      return cached;
    }

    // Ejecutar todos los conteos en paralelo - mucho más rápido que findMany
    const [totalUsuarios, conteoActivos, conteoSuspendidos, conteoInactivos] = await Promise.all([
      this.prisma.usuario.count(),
      this.prisma.usuario.count({
        where: {
          estado: {
            nombre: 'activo'
          }
        }
      }),
      this.prisma.usuario.count({
        where: {
          estado: {
            nombre: 'suspendido'
          }
        }
      }),
      this.prisma.usuario.count({
        where: {
          estado: {
            nombre: 'inactivo'
          }
        }
      })
    ]);

    const porcentajeActivos = totalUsuarios > 0 ? Number(((conteoActivos / totalUsuarios) * 100).toFixed(2)) : 0;
    const porcentajeSuspendidos = totalUsuarios > 0 ? Number(((conteoSuspendidos / totalUsuarios) * 100).toFixed(2)) : 0;
    const porcentajeInactivos = totalUsuarios > 0 ? Number(((conteoInactivos / totalUsuarios) * 100).toFixed(2)) : 0;

    const resultado = {
      resumen: {
        total: totalUsuarios,
        activos: {
          conteo: conteoActivos,
          porcentaje: porcentajeActivos
        },
        suspendidos: {
          conteo: conteoSuspendidos,
          porcentaje: porcentajeSuspendidos
        },
        inactivos: {
          conteo: conteoInactivos,
          porcentaje: porcentajeInactivos
        }
      },
    };

    // Guardar en caché por 5 minutos (300000 ms)
    await this.cacheManager.set(this.CACHE_KEY_STATISTICS, resultado, 300000);

    return resultado;
  }

  async getUsersByRoleStatistics() {
    const CACHE_KEY = 'estadisticas:usuarios:roles';

    // Intentar obtener del caché
    const cached = await this.cacheManager.get(CACHE_KEY);
    if (cached) {
      return cached;
    }

    // Usar una sola query con groupBy para contar usuarios por rol
    // Esto es mucho más eficiente que múltiples queries
    const [totalUsuarios, roleGroups] = await Promise.all([
      this.prisma.usuario.count(),
      this.prisma.usuario.groupBy({
        by: ['rolId'],
        _count: {
          id: true,
        },
      }),
    ]);

    // Obtener información de todos los roles en una sola query
    const roles = await this.prisma.rol.findMany({
      select: {
        id: true,
        nombre: true,
      },
    });

    // Crear un map para acceso rápido a los conteos
    const roleCountMap = new Map(
      roleGroups.map(group => [group.rolId, group._count.id])
    );

    // Construir el resultado con todos los roles, incluso si tienen 0 usuarios
    const roleStats = roles.map(rol => {
      const conteo = roleCountMap.get(rol.id) || 0;
      const porcentaje = totalUsuarios > 0
        ? Number(((conteo / totalUsuarios) * 100).toFixed(2))
        : 0;

      return {
        rolId: rol.id,
        rol: rol.nombre,
        conteo,
        porcentaje,
      };
    });

    const resultado = {
      totalUsuarios,
      roles: roleStats,
    };

    // Guardar en caché por 5 minutos (300000 ms)
    await this.cacheManager.set(CACHE_KEY, resultado, 300000);

    return resultado;
  }
}
