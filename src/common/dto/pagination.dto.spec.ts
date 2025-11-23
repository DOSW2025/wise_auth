import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { PaginationDto } from './pagination.dto';

 

describe('PaginationDto', () => {

  it('should accept valid pagination values', async () => {

    const dto = plainToClass(PaginationDto, { page: 1, limit: 10 });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);

  });

 

  it('should use default values when not provided', async () => {

    const dto = plainToClass(PaginationDto, {});

    expect(dto.page).toBe(1);

    expect(dto.limit).toBe(10);

  });

 

  it('should transform string to number', async () => {

    const dto = plainToClass(PaginationDto, { page: '2', limit: '20' });

    expect(typeof dto.page).toBe('number');

    expect(typeof dto.limit).toBe('number');

    expect(dto.page).toBe(2);

    expect(dto.limit).toBe(20);

  });

 

  it('should reject negative page values', async () => {

    const dto = plainToClass(PaginationDto, { page: -1, limit: 10 });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

    expect(errors[0].property).toBe('page');

  });

 

  it('should reject zero page value', async () => {

    const dto = plainToClass(PaginationDto, { page: 0, limit: 10 });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

  });

 

  it('should reject negative limit values', async () => {

    const dto = plainToClass(PaginationDto, { page: 1, limit: -5 });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

    expect(errors[0].property).toBe('limit');

  });

 

  it('should reject zero limit value', async () => {

    const dto = plainToClass(PaginationDto, { page: 1, limit: 0 });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);

  });

 

  it('should accept large page numbers', async () => {

    const dto = plainToClass(PaginationDto, { page: 100, limit: 50 });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);

    expect(dto.page).toBe(100);

    expect(dto.limit).toBe(50);

  });

 

  it('should handle decimal numbers by transforming them', async () => {

    const dto = plainToClass(PaginationDto, { page: '1.5', limit: '10.9' });

    // Type transformation should handle this

    expect(dto.page).toBe(1.5);

    expect(dto.limit).toBe(10.9);

  });

});