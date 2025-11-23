import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ChangeStatusDto } from './change-status.dto';

 

describe('ChangeStatusDto', () => {

  it('should accept valid status ID', async () => {

    const dto = plainToClass(ChangeStatusDto, { estadoId: 1 });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);

    expect(dto.estadoId).toBe(1);

  });

 

  it('should transform string to number', async () => {

    const dto = plainToClass(ChangeStatusDto, { estadoId: '2' });

    expect(typeof dto.estadoId).toBe('number');

    expect(dto.estadoId).toBe(2);

  });

 

  it('should accept status ID 3 (suspendido)', async () => {

    const dto = plainToClass(ChangeStatusDto, { estadoId: 3 });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);

    expect(dto.estadoId).toBe(3);

  });

 

  it('should reject negative status IDs', async () => {

    const dto = plainToClass(ChangeStatusDto, { estadoId: -1 });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

    expect(errors[0].property).toBe('estadoId');

  });

 

  it('should reject zero as status ID', async () => {

    const dto = plainToClass(ChangeStatusDto, { estadoId: 0 });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

  });

 

  it('should reject non-integer values', async () => {

    const dto = plainToClass(ChangeStatusDto, { estadoId: 2.5 });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

  });

 

  it('should reject string that cannot be converted to number', async () => {

    const dto = plainToClass(ChangeStatusDto, { estadoId: 'xyz' });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

  });

 

  it('should reject missing estadoId', async () => {

    const dto = plainToClass(ChangeStatusDto, {});

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

    expect(errors[0].property).toBe('estadoId');

  });

 

  it('should accept large positive integers', async () => {

    const dto = plainToClass(ChangeStatusDto, { estadoId: 999 });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);

    expect(dto.estadoId).toBe(999);

  });

});