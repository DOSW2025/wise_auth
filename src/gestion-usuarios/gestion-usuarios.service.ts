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
  private readonly CACHE_KEY_GROWTH_PREFIX = 'estadisticas:usuarios:crecimiento:';
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

    // Invalidar cachés de crecimiento (todas las variantes de semanas)
    // Común tener: 4, 8, 12, 16, 20, 24 semanas
    const growthKeys = [4, 8, 12, 16, 20, 24].map(
      weeks => `${this.CACHE_KEY_GROWTH_PREFIX}semanas:${weeks}`
    );
    await Promise.all(growthKeys.map(key => this.cacheManager.del(key)));

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

  async getUserGrowthByWeek(weeks: number = 12) {
    const CACHE_KEY = `estadisticas:usuarios:crecimiento:semanas:${weeks}`;

    // Intentar obtener del caché
    const cached = await this.cacheManager.get(CACHE_KEY);
    if (cached) {
      return cached;
    }

    // Calcular la fecha de inicio (hace N semanas)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));

    // Obtener todos los usuarios creados en el rango de fechas
    const usuarios = await this.prisma.usuario.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Agrupar usuarios por semana
    const semanas = new Map<string, number>();

    // Inicializar todas las semanas con 0
    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (i * 7));
      const weekKey = this.getWeekKey(weekStart);
      semanas.set(weekKey, 0);
    }

    // Contar usuarios por semana
    usuarios.forEach(usuario => {
      const weekKey = this.getWeekKey(usuario.createdAt);
      const current = semanas.get(weekKey) || 0;
      semanas.set(weekKey, current + 1);
    });

    // Convertir a array ordenado
    const data = Array.from(semanas.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([semana, conteo]) => ({
        semana,
        conteo,
        fecha: this.parsearSemana(semana),
      }));

    const resultado = {
      periodo: {
        inicio: startDate.toISOString(),
        fin: endDate.toISOString(),
        semanas: weeks,
      },
      totalUsuariosNuevos: usuarios.length,
      data,
    };

    // Guardar en caché por 10 minutos (600000 ms)
    await this.cacheManager.set(CACHE_KEY, resultado, 600000);

    return resultado;
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const weekNumber = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  private parsearSemana(weekKey: string): string {
    const [year, week] = weekKey.split('-W');
    const startOfYear = new Date(parseInt(year), 0, 1);
    const weekStart = new Date(startOfYear);
    weekStart.setDate(startOfYear.getDate() + (parseInt(week) - 1) * 7);

    return weekStart.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    });
  }
}
