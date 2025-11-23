import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    usuario: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users with default values', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'user1@example.com',
          nombre: 'User',
          apellido: 'One',
          rol: 'estudiante',
          estado: 'activo',
          createdAt: new Date(),
          updatedAt: new Date(),
          avatar_url: null,
          telefono: null,
        },
      ];

      mockPrismaService.usuario.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.usuario.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('User One');
      expect(result.pagination.totalItems).toBe(1);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.itemsPerPage).toBe(10);
    });

    it('should handle search parameter', async () => {
      mockPrismaService.usuario.findMany.mockResolvedValue([]);
      mockPrismaService.usuario.count.mockResolvedValue(0);

      await service.findAll({ search: 'john' });

      expect(prismaService.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { nombre: { contains: 'john', mode: 'insensitive' } },
              { apellido: { contains: 'john', mode: 'insensitive' } },
              { email: { contains: 'john', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });

    it('should filter by role', async () => {
      mockPrismaService.usuario.findMany.mockResolvedValue([]);
      mockPrismaService.usuario.count.mockResolvedValue(0);

      await service.findAll({ role: 'admin' });

      expect(prismaService.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            rol: 'admin',
          }),
        })
      );
    });

    it('should filter by status active', async () => {
      mockPrismaService.usuario.findMany.mockResolvedValue([]);
      mockPrismaService.usuario.count.mockResolvedValue(0);

      await service.findAll({ status: 'active' });

      expect(prismaService.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            estado: 'activo',
          }),
        })
      );
    });

    it('should filter by status suspended', async () => {
      mockPrismaService.usuario.findMany.mockResolvedValue([]);
      mockPrismaService.usuario.count.mockResolvedValue(0);

      await service.findAll({ status: 'suspended' });

      expect(prismaService.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            estado: 'suspendido',
          }),
        })
      );
    });

    it('should calculate pagination correctly', async () => {
      mockPrismaService.usuario.findMany.mockResolvedValue([]);
      mockPrismaService.usuario.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(result.pagination.totalItems).toBe(25);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.currentPage).toBe(2);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPreviousPage).toBe(true);
    });

    it('should calculate skip correctly for page 2', async () => {
      mockPrismaService.usuario.findMany.mockResolvedValue([]);
      mockPrismaService.usuario.count.mockResolvedValue(0);

      await service.findAll({ page: 2, limit: 10 });

      expect(prismaService.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });

  describe('updateRole', () => {
    it('should update user role successfully', async () => {
      const userId = '123';
      const role = 'admin';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        nombre: 'Test',
        apellido: 'User',
        rol: 'admin',
        estado: 'activo',
        createdAt: new Date(),
        updatedAt: new Date(),
        avatar_url: null,
        telefono: null,
      };

      mockPrismaService.usuario.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.usuario.update.mockResolvedValue(mockUser);

      const result = await service.updateRole(userId, role);

      expect(result.role).toBe('admin');
      expect(prismaService.usuario.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { rol: role },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = '999';
      mockPrismaService.usuario.findUnique.mockResolvedValue(null);

      await expect(service.updateRole(userId, 'admin')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.updateRole(userId, 'admin')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('suspend', () => {
    it('should suspend user successfully', async () => {
      const userId = '123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        nombre: 'Test',
        apellido: 'User',
        rol: 'estudiante',
        estado: 'suspendido',
        createdAt: new Date(),
        updatedAt: new Date(),
        avatar_url: null,
        telefono: null,
      };

      mockPrismaService.usuario.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.usuario.update.mockResolvedValue(mockUser);

      const result = await service.suspend(userId, 'Violación de términos');

      expect(result.isActive).toBe(false);
      expect(prismaService.usuario.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { estado: 'suspendido' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.usuario.findUnique.mockResolvedValue(null);

      await expect(service.suspend('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('activate', () => {
    it('should activate user successfully', async () => {
      const userId = '123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        nombre: 'Test',
        apellido: 'User',
        rol: 'estudiante',
        estado: 'activo',
        createdAt: new Date(),
        updatedAt: new Date(),
        avatar_url: null,
        telefono: null,
      };

      mockPrismaService.usuario.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.usuario.update.mockResolvedValue(mockUser);

      const result = await service.activate(userId);

      expect(result.isActive).toBe(true);
      expect(prismaService.usuario.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { estado: 'activo' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.usuario.findUnique.mockResolvedValue(null);

      await expect(service.activate('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('mapToDto', () => {
    it('should map user to DTO correctly', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        nombre: 'John',
        apellido: 'Doe',
        rol: 'estudiante',
        estado: 'activo',
        createdAt: new Date(),
        updatedAt: new Date(),
        avatar_url: 'https://example.com/avatar.jpg',
        telefono: '+123456789',
      };

      const dto = service['mapToDto'](mockUser);

      expect(dto).toEqual({
        id: '123',
        email: 'test@example.com',
        name: 'John Doe',
        role: 'estudiante',
        isActive: true,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        avatar: 'https://example.com/avatar.jpg',
        phoneNumber: '+123456789',
      });
    });

    it('should handle inactive user', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        nombre: 'John',
        apellido: 'Doe',
        rol: 'estudiante',
        estado: 'suspendido',
        createdAt: new Date(),
        updatedAt: new Date(),
        avatar_url: null,
        telefono: null,
      };

      const dto = service['mapToDto'](mockUser);

      expect(dto.isActive).toBe(false);
    });
  });
});