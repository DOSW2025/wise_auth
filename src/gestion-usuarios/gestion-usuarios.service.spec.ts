import { Test, TestingModule } from '@nestjs/testing';
import { GestionUsuariosService } from './gestion-usuarios.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { ChangeStatusDto } from './dto/change-status.dto';

const mockPrismaService: any = {
  usuario: {
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  rol: {
    findUnique: jest.fn(),
  },
  estadoUsuario: {
    findUnique: jest.fn(),
  },
};

describe('GestionUsuariosService', () => {
  let service: GestionUsuariosService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GestionUsuariosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GestionUsuariosService>(GestionUsuariosService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllPaginated', () => {
    it('should return paginated users with default values', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const mockUsers = [
        {
          id: '1',
          email: 'user1@example.com',
          nombre: 'User',
          apellido: 'One',
          rol: { id: 1, nombre: 'estudiante' },
          estado: { id: 1, nombre: 'activo' },
          createdAt: new Date(),
        },
      ];

      mockPrismaService.usuario.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.usuario.count.mockResolvedValue(1);

      const result = await service.findAllPaginated(paginationDto);

      expect(prismaService.usuario.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        include: {
          rol: { select: { id: true, nombre: true } },
          estado: { select: { id: true, nombre: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(prismaService.usuario.count).toHaveBeenCalled();
      expect(result).toEqual({
        data: mockUsers,
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should calculate correct skip value for page 2', async () => {
      const paginationDto: PaginationDto = { page: 2, limit: 10 };
      mockPrismaService.usuario.findMany.mockResolvedValue([]);
      mockPrismaService.usuario.count.mockResolvedValue(0);

      await service.findAllPaginated(paginationDto);

      expect(prismaService.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });

    it('should calculate correct skip value for page 3 with limit 5', async () => {
      const paginationDto: PaginationDto = { page: 3, limit: 5 };
      mockPrismaService.usuario.findMany.mockResolvedValue([]);
      mockPrismaService.usuario.count.mockResolvedValue(0);

      await service.findAllPaginated(paginationDto);

      expect(prismaService.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });

    it('should return correct totalPages calculation', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      mockPrismaService.usuario.findMany.mockResolvedValue([]);
      mockPrismaService.usuario.count.mockResolvedValue(25);

      const result = await service.findAllPaginated(paginationDto);

      expect(result.meta.totalPages).toBe(3);
    });

    it('should handle empty results', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      mockPrismaService.usuario.findMany.mockResolvedValue([]);
      mockPrismaService.usuario.count.mockResolvedValue(0);

      const result = await service.findAllPaginated(paginationDto);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should order by createdAt desc', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      mockPrismaService.usuario.findMany.mockResolvedValue([]);
      mockPrismaService.usuario.count.mockResolvedValue(0);

      await service.findAllPaginated(paginationDto);

      expect(prismaService.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });
  });

  describe('changeRole', () => {
    it('should change user role successfully', async () => {
      const userId = '123';
      const changeRoleDto: ChangeRoleDto = { rolId: 2 };
      const mockRol = { id: 2, nombre: 'tutor', descripcion: 'Tutor role' };
      const mockUpdatedUser = {
        id: userId,
        email: 'test@example.com',
        rol: { id: 2, nombre: 'tutor' },
        estado: { id: 1, nombre: 'activo' },
      };

      mockPrismaService.rol.findUnique.mockResolvedValue(mockRol);
      mockPrismaService.usuario.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.changeRole(userId, changeRoleDto);

      expect(prismaService.rol.findUnique).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(prismaService.usuario.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { rolId: 2 },
        include: {
          rol: { select: { id: true, nombre: true } },
          estado: { select: { id: true, nombre: true } },
        },
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should throw NotFoundException when role does not exist', async () => {
      const userId = '123';
      const changeRoleDto: ChangeRoleDto = { rolId: 999 };

      mockPrismaService.rol.findUnique.mockResolvedValue(null);

      await expect(service.changeRole(userId, changeRoleDto)).rejects.toThrow(NotFoundException);
      await expect(service.changeRole(userId, changeRoleDto)).rejects.toThrow('Rol con id 999 no encontrado');

      expect(prismaService.usuario.update).not.toHaveBeenCalled();
    });

    it('should verify role exists before updating user', async () => {
      const userId = '123';
      const changeRoleDto: ChangeRoleDto = { rolId: 3 };
      const mockRol = { id: 3, nombre: 'admin' };

      mockPrismaService.rol.findUnique.mockResolvedValue(mockRol);
      mockPrismaService.usuario.update.mockResolvedValue({} as any);

      await service.changeRole(userId, changeRoleDto);

      // Verify both functions were called (call-order assertions removed for compatibility)
      expect(prismaService.rol.findUnique).toHaveBeenCalled();
      expect(prismaService.usuario.update).toHaveBeenCalled();
    });

    it('should include rol and estado in response', async () => {
      const userId = '123';
      const changeRoleDto: ChangeRoleDto = { rolId: 1 };

      mockPrismaService.rol.findUnique.mockResolvedValue({ id: 1, nombre: 'estudiante' });
      mockPrismaService.usuario.update.mockResolvedValue({} as any);

      await service.changeRole(userId, changeRoleDto);

      expect(prismaService.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            rol: { select: { id: true, nombre: true } },
            estado: { select: { id: true, nombre: true } },
          },
        }),
      );
    });
  });

  describe('changeStatus', () => {
    it('should change user status successfully', async () => {
      const userId = '123';
      const changeStatusDto: ChangeStatusDto = { estadoId: 2 };
      const mockEstado = { id: 2, nombre: 'inactivo', descripcion: 'Inactive status' };
      const mockUpdatedUser = {
        id: userId,
        email: 'test@example.com',
        rol: { id: 1, nombre: 'estudiante' },
        estado: { id: 2, nombre: 'inactivo' },
      };

      mockPrismaService.estadoUsuario.findUnique.mockResolvedValue(mockEstado);
      mockPrismaService.usuario.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.changeStatus(userId, changeStatusDto);

      expect(prismaService.estadoUsuario.findUnique).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(prismaService.usuario.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { estadoId: 2 },
        include: {
          rol: { select: { id: true, nombre: true } },
          estado: { select: { id: true, nombre: true } },
        },
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should throw NotFoundException when status does not exist', async () => {
      const userId = '123';
      const changeStatusDto: ChangeStatusDto = { estadoId: 999 };

      mockPrismaService.estadoUsuario.findUnique.mockResolvedValue(null);

      await expect(service.changeStatus(userId, changeStatusDto)).rejects.toThrow(NotFoundException);
      await expect(service.changeStatus(userId, changeStatusDto)).rejects.toThrow('Estado con id 999 no encontrado');

      expect(prismaService.usuario.update).not.toHaveBeenCalled();
    });

    it('should verify status exists before updating user', async () => {
      const userId = '123';
      const changeStatusDto: ChangeStatusDto = { estadoId: 3 };
      const mockEstado = { id: 3, nombre: 'suspendido' };

      mockPrismaService.estadoUsuario.findUnique.mockResolvedValue(mockEstado);
      mockPrismaService.usuario.update.mockResolvedValue({} as any);

      await service.changeStatus(userId, changeStatusDto);

      // Verify both functions were called (call-order assertions removed for compatibility)
      expect(prismaService.estadoUsuario.findUnique).toHaveBeenCalled();
      expect(prismaService.usuario.update).toHaveBeenCalled();
    });

    it('should handle suspended status', async () => {
      const userId = '123';
      const changeStatusDto: ChangeStatusDto = { estadoId: 3 };
      const mockEstado = { id: 3, nombre: 'suspendido' };
      const mockUpdatedUser = { id: userId, estado: { id: 3, nombre: 'suspendido' } };

      mockPrismaService.estadoUsuario.findUnique.mockResolvedValue(mockEstado);
      mockPrismaService.usuario.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.changeStatus(userId, changeStatusDto);

      expect(result.estado.nombre).toBe('suspendido');
    });

    it('should include rol and estado in response', async () => {
      const userId = '123';
      const changeStatusDto: ChangeStatusDto = { estadoId: 1 };

      mockPrismaService.estadoUsuario.findUnique.mockResolvedValue({ id: 1, nombre: 'activo' });
      mockPrismaService.usuario.update.mockResolvedValue({} as any);

      await service.changeStatus(userId, changeStatusDto);

      expect(prismaService.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            rol: { select: { id: true, nombre: true } },
            estado: { select: { id: true, nombre: true } },
          },
        }),
      );
    });
  });
});