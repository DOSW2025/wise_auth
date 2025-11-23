import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findAll: jest.fn(),
    updateRole: jest.fn(),
    suspend: jest.fn(),
    activate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const query = { page: 1, limit: 10, search: '', role: '', status: '' };
      const mockResult = {
        data: [
          {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'estudiante',
            isActive: true,
          },
        ],
        pagination: {
          totalItems: 1,
          totalPages: 1,
          currentPage: 1,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      mockUsersService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: '',
        role: '',
        status: '',
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle search parameter', async () => {
      const query = { page: 1, limit: 10, search: 'john', role: '', status: '' };
      
      mockUsersService.findAll.mockResolvedValue({ data: [], pagination: {} });

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'john' })
      );
    });

    it('should handle role filter', async () => {
      const query = { page: 1, limit: 10, search: '', role: 'admin', status: '' };
      
      mockUsersService.findAll.mockResolvedValue({ data: [], pagination: {} });

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'admin' })
      );
    });

    it('should handle status filter', async () => {
      const query = { page: 1, limit: 10, search: '', role: '', status: 'active' };
      
      mockUsersService.findAll.mockResolvedValue({ data: [], pagination: {} });

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' })
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
        name: 'Test User',
        role: 'admin',
        isActive: true,
      };

      mockUsersService.updateRole.mockResolvedValue(mockUser);

      const result = await controller.updateRole(userId, role);

      expect(service.updateRole).toHaveBeenCalledWith(userId, role);
      expect(result).toEqual(mockUser);
    });
  });

  describe('suspend', () => {
    it('should suspend user successfully', async () => {
      const userId = '123';
      const reason = 'Violación de términos';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'estudiante',
        isActive: false,
      };

      mockUsersService.suspend.mockResolvedValue(mockUser);

      const result = await controller.suspend(userId, reason);

      expect(service.suspend).toHaveBeenCalledWith(userId, reason);
      expect(result).toEqual(mockUser);
    });

    it('should suspend user without reason', async () => {
      const userId = '123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'estudiante',
        isActive: false,
      };

      mockUsersService.suspend.mockResolvedValue(mockUser);

      await controller.suspend(userId, undefined as any);

      expect(service.suspend).toHaveBeenCalledWith(userId, undefined);
    });
  });

  describe('activate', () => {
    it('should activate user successfully', async () => {
      const userId = '123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'estudiante',
        isActive: true,
      };

      mockUsersService.activate.mockResolvedValue(mockUser);

      const result = await controller.activate(userId);

      expect(service.activate).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });
  });
});