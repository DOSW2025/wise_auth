import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

/**
 * Decorator para especificar qué roles pueden acceder a una ruta.
 *
 * @example
 * // Solo admin puede acceder
 * @Roles(Role.ADMIN)
 *
 * @example
 * // Admin o tutor pueden acceder
 * @Roles(Role.ADMIN, Role.TUTOR)
 * es solo un ejemplo pero dejen la documentación como esta en todo microservicio que implemente auth.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
