import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { ChangeStatusDto } from './dto/change-status.dto';

@Injectable()
export class GestionUsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPaginated(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    // skip calcula cuántos registros omitir según la página actual (-1 porque las páginas empiezan en 1, no en 0) =) si lo ven lo pueden copiar tal cual
    const skip = (page - 1) * limit;

    const [usuarios, total] = await Promise.all([
      this.prisma.usuario.findMany({
        skip,
        take: limit,
        include: {
          rol: { select: { id: true, nombre: true } },
          estado: { select: { id: true, nombre: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.usuario.count(),
    ]);

    return {
      data: usuarios,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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

    return usuario;
  }
}
