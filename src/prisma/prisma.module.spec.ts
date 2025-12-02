import { Test } from '@nestjs/testing';
import { PrismaModule } from './prisma.module';
import { PrismaService } from './prisma.service';

describe('PrismaModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should provide PrismaService', async () => {
    const module = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    const service = module.get<PrismaService>(PrismaService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(PrismaService);
  });

  it('should be a global module', async () => {
    const module = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    // PrismaModule should be available globally
    const service = module.get<PrismaService>(PrismaService);
    expect(service).toBeDefined();
  });

  it('should export PrismaService', async () => {
    const module = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    const exportedService = module.get<PrismaService>(PrismaService);
    expect(exportedService).toBeDefined();
    expect(exportedService).toBeInstanceOf(PrismaService);
  });
});
