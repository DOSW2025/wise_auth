import { Test, TestingModule } from '@nestjs/testing';
import { GestionUsuariosController } from './gestion-usuarios.controller';
import { GestionUsuariosService } from './gestion-usuarios.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { ChangeStatusDto } from './dto/change-status.dto';

 

describe('GestionUsuariosController', () => {

  let controller: GestionUsuariosController;

  let service: GestionUsuariosService;

 

  const mockGestionUsuariosService = {

    findAllPaginated: jest.fn(),

    changeRole: jest.fn(),

    changeStatus: jest.fn(),

  };

 

  beforeEach(async () => {

    const module: TestingModule = await Test.createTestingModule({

      controllers: [GestionUsuariosController],

      providers: [

        {

          provide: GestionUsuariosService,

          useValue: mockGestionUsuariosService,

        },

      ],

    }).compile();

 

    controller = module.get<GestionUsuariosController>(GestionUsuariosController);

    service = module.get<GestionUsuariosService>(GestionUsuariosService);

 

    jest.clearAllMocks();

  });

 

  it('should be defined', () => {

    expect(controller).toBeDefined();

  });

 

  describe('findAll', () => {

    it('should return paginated users', async () => {

      const paginationDto: PaginationDto = { page: 1, limit: 10 };

      const mockResult = {

        data: [

          {

            id: '1',

            email: 'test@example.com',

            nombre: 'Test',

            apellido: 'User',

            rol: { id: 1, nombre: 'estudiante' },

            estado: { id: 1, nombre: 'activo' },

          },

        ],

        meta: {

          total: 1,

          page: 1,

          limit: 10,

          totalPages: 1,

        },

      };

 

      mockGestionUsuariosService.findAllPaginated.mockResolvedValue(mockResult);

 

      const result = await controller.findAll(paginationDto);

 

      expect(service.findAllPaginated).toHaveBeenCalledWith(paginationDto);

      expect(result).toEqual(mockResult);

    });

 

    it('should use default pagination values when not provided', async () => {

      const paginationDto: PaginationDto = { page: 1, limit: 10 };

      const mockResult = {

        data: [],

        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },

      };

 

      mockGestionUsuariosService.findAllPaginated.mockResolvedValue(mockResult);

 

      await controller.findAll(paginationDto);

 

      expect(service.findAllPaginated).toHaveBeenCalledWith(paginationDto);

    });

 

    it('should handle different page numbers', async () => {

      const paginationDto: PaginationDto = { page: 2, limit: 5 };

      const mockResult = {

        data: [],

        meta: { total: 15, page: 2, limit: 5, totalPages: 3 },

      };

 

      mockGestionUsuariosService.findAllPaginated.mockResolvedValue(mockResult);

 

      const result = await controller.findAll(paginationDto);

 

      expect(service.findAllPaginated).toHaveBeenCalledWith(paginationDto);

      expect(result.meta.page).toBe(2);

      expect(result.meta.limit).toBe(5);

    });

  });

 

  describe('changeRole', () => {

    it('should change user role successfully', async () => {

      const userId = '123';

      const changeRoleDto: ChangeRoleDto = { rolId: 2 };

      const mockUser = {

        id: userId,

        email: 'test@example.com',

        nombre: 'Test',

        apellido: 'User',

        rol: { id: 2, nombre: 'tutor' },

        estado: { id: 1, nombre: 'activo' },

      };

 

      mockGestionUsuariosService.changeRole.mockResolvedValue(mockUser);

 

      const result = await controller.changeRole(userId, changeRoleDto);

 

      expect(service.changeRole).toHaveBeenCalledWith(userId, changeRoleDto);

      expect(result).toEqual(mockUser);

      expect(result.rol.id).toBe(2);

    });

 

    it('should handle role change to admin', async () => {

      const userId = '123';

      const changeRoleDto: ChangeRoleDto = { rolId: 3 };

      const mockUser = {

        id: userId,

        email: 'test@example.com',

        rol: { id: 3, nombre: 'admin' },

      };

 

      mockGestionUsuariosService.changeRole.mockResolvedValue(mockUser);

 

      const result = await controller.changeRole(userId, changeRoleDto);

 

      expect(result.rol.id).toBe(3);

    });

 

    it('should pass the correct parameters to service', async () => {

      const userId = 'user-uuid-123';

      const changeRoleDto: ChangeRoleDto = { rolId: 1 };

 

      mockGestionUsuariosService.changeRole.mockResolvedValue({});

 

      await controller.changeRole(userId, changeRoleDto);

 

      expect(service.changeRole).toHaveBeenCalledWith(userId, changeRoleDto);

      expect(service.changeRole).toHaveBeenCalledTimes(1);

    });

  });

 

  describe('changeStatus', () => {

    it('should change user status successfully', async () => {

      const userId = '123';

      const changeStatusDto: ChangeStatusDto = { estadoId: 2 };

      const mockUser = {

        id: userId,

        email: 'test@example.com',

        nombre: 'Test',

        apellido: 'User',

        rol: { id: 1, nombre: 'estudiante' },

        estado: { id: 2, nombre: 'inactivo' },

      };

 

      mockGestionUsuariosService.changeStatus.mockResolvedValue(mockUser);

 

      const result = await controller.changeStatus(userId, changeStatusDto);

 

      expect(service.changeStatus).toHaveBeenCalledWith(userId, changeStatusDto);

      expect(result).toEqual(mockUser);

      expect(result.estado.id).toBe(2);

    });

 

    it('should handle status change to suspended', async () => {

      const userId = '123';

      const changeStatusDto: ChangeStatusDto = { estadoId: 3 };

      const mockUser = {

        id: userId,

        email: 'test@example.com',

        estado: { id: 3, nombre: 'suspendido' },

      };

 

      mockGestionUsuariosService.changeStatus.mockResolvedValue(mockUser);

 

      const result = await controller.changeStatus(userId, changeStatusDto);

 

      expect(result.estado.id).toBe(3);

    });

 

    it('should pass the correct parameters to service', async () => {

      const userId = 'user-uuid-456';

      const changeStatusDto: ChangeStatusDto = { estadoId: 1 };

 

      mockGestionUsuariosService.changeStatus.mockResolvedValue({});

 

      await controller.changeStatus(userId, changeStatusDto);

 

      expect(service.changeStatus).toHaveBeenCalledWith(userId, changeStatusDto);

      expect(service.changeStatus).toHaveBeenCalledTimes(1);

    });

  });

});