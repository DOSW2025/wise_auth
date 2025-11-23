import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

//Pruebas unitarias de la BD (para comprobar que su conexión y desconexión es correcta); maneja los errores de conexión y desconexión.

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be an instance of PrismaService', () => {
    expect(service).toBeInstanceOf(PrismaService);
  });

  describe('onModuleInit', () => {
    it('should call $connect when module initializes', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue(undefined as any);

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalled();
      expect(connectSpy).toHaveBeenCalledTimes(1);

      connectSpy.mockRestore();
    });

    it('should handle connection errors gracefully', async () => {
      const error = new Error('Connection failed');
      const connectSpy = jest.spyOn(service, '$connect').mockRejectedValue(error);

      await expect(service.onModuleInit()).rejects.toThrow('Connection failed');

      connectSpy.mockRestore();
    });
  });

  describe('onModuleDestroy', () => {
    it('should call $disconnect when module is destroyed', async () => {
      const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue(undefined as any);

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalled();
      expect(disconnectSpy).toHaveBeenCalledTimes(1);

      disconnectSpy.mockRestore();
    });

    it('should handle disconnection errors gracefully', async () => {
      const error = new Error('Disconnection failed');
      const disconnectSpy = jest.spyOn(service, '$disconnect').mockRejectedValue(error);

      await expect(service.onModuleDestroy()).rejects.toThrow('Disconnection failed');

      disconnectSpy.mockRestore();
    });
  });

  describe('lifecycle hooks', () => {
    it('should connect on init and disconnect on destroy', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue(undefined as any);
      const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue(undefined as any);

      await service.onModuleInit();
      expect(connectSpy).toHaveBeenCalled();

      await service.onModuleDestroy();
      expect(disconnectSpy).toHaveBeenCalled();

      connectSpy.mockRestore();
      disconnectSpy.mockRestore();
    });

    it('should implement OnModuleInit interface', () => {
      expect(typeof service.onModuleInit).toBe('function');
    });

    it('should implement OnModuleDestroy interface', () => {
      expect(typeof service.onModuleDestroy).toBe('function');
    });
  });

  describe('PrismaClient functionality', () => {
    it('should have usuario model available', () => {
      expect(service.usuario).toBeDefined();
    });

    it('should have $connect method', () => {
      expect(typeof service.$connect).toBe('function');
    });

    it('should have $disconnect method', () => {
      expect(typeof service.$disconnect).toBe('function');
    });

    it('should have $transaction method', () => {
      expect(typeof service.$transaction).toBe('function');
    });
  });
});
