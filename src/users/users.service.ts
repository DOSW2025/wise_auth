import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, RolEnum, EstadoUsuario } from '../../generated/prisma';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(params: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        status?: string;
    }) {
        const { page = 1, limit = 10, search, role, status } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.UsuarioWhereInput = {};

        if (search) {
            where.OR = [
                { nombre: { contains: search, mode: 'insensitive' } },
                { apellido: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role) {
            where.rol = role as RolEnum;
        }

        if (status) {
            // Map frontend status to backend status
            // Frontend: 'active', 'suspended'
            // Backend: 'activo', 'suspendido', 'inactivo'
            if (status === 'active') where.estado = EstadoUsuario.activo;
            else if (status === 'suspended') where.estado = EstadoUsuario.suspendido;
        }

        const [users, total] = await Promise.all([
            this.prisma.usuario.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.usuario.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);
        const currentPage = Number(page);

        return {
            data: users.map(this.mapToDto),
            pagination: {
                totalItems: total,
                totalPages,
                currentPage,
                itemsPerPage: Number(limit),
                hasNextPage: currentPage < totalPages,
                hasPreviousPage: currentPage > 1,
            },
        };
    }

    async updateRole(id: string, role: string) {
        const user = await this.prisma.usuario.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('User not found');

        const updatedUser = await this.prisma.usuario.update({
            where: { id },
            data: { rol: role as RolEnum },
        });

        return this.mapToDto(updatedUser);
    }

    async suspend(id: string, reason?: string) {
        const user = await this.prisma.usuario.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('User not found');

        // Note: reason is not stored in DB currently
        const updatedUser = await this.prisma.usuario.update({
            where: { id },
            data: { estado: EstadoUsuario.suspendido },
        });

        return this.mapToDto(updatedUser);
    }

    async activate(id: string) {
        const user = await this.prisma.usuario.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('User not found');

        const updatedUser = await this.prisma.usuario.update({
            where: { id },
            data: { estado: EstadoUsuario.activo },
        });

        return this.mapToDto(updatedUser);
    }

    private mapToDto(user: any) {
        return {
            id: user.id,
            email: user.email,
            name: `${user.nombre} ${user.apellido}`.trim(),
            role: user.rol,
            isActive: user.estado === EstadoUsuario.activo,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            avatar: user.avatar_url,
            phoneNumber: user.telefono,
        };
    }
}
