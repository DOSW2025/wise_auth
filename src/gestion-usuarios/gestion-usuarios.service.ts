import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ChangeRoleDto, ChangeStatusDto, UpdatePersonalInfoDto } from './dto';

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

    return { message: 'Usuario eliminado exitosamente', userId };
  }
}
