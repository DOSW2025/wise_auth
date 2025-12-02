import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ChangeRoleDto } from './change-role.dto';

 

describe('ChangeRoleDto', () => {

  it('should accept valid role ID', async () => {

    const dto = plainToClass(ChangeRoleDto, { rolId: 1 });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);

    expect(dto.rolId).toBe(1);

  });

 

  it('should transform string to number', async () => {

    const dto = plainToClass(ChangeRoleDto, { rolId: '2' });

    expect(typeof dto.rolId).toBe('number');

    expect(dto.rolId).toBe(2);

  });

 

  it('should accept role ID 3 (admin)', async () => {

    const dto = plainToClass(ChangeRoleDto, { rolId: 3 });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);

    expect(dto.rolId).toBe(3);

  });

 

  it('should reject negative role IDs', async () => {

    const dto = plainToClass(ChangeRoleDto, { rolId: -1 });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

    expect(errors[0].property).toBe('rolId');

  });

 

  it('should reject zero as role ID', async () => {

    const dto = plainToClass(ChangeRoleDto, { rolId: 0 });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

  });

 

  it('should reject non-integer values', async () => {

    const dto = plainToClass(ChangeRoleDto, { rolId: 1.5 });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

  });

 

  it('should reject string that cannot be converted to number', async () => {

    const dto = plainToClass(ChangeRoleDto, { rolId: 'abc' });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

  });

 

  it('should reject missing rolId', async () => {

    const dto = plainToClass(ChangeRoleDto, {});

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

    expect(errors[0].property).toBe('rolId');

  });

 

  it('should accept large positive integers', async () => {

    const dto = plainToClass(ChangeRoleDto, { rolId: 999 });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);

    expect(dto.rolId).toBe(999);

  });

});