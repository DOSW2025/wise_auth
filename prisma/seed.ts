// Importamos desde @prisma/client (ubicación por defecto en node_modules)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
//(esto es para ingresar datos iniciales a la base de datos)
async function main() {
  // Crear roles
  const roles = await Promise.all([
    prisma.rol.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, nombre: 'estudiante', descripcion: 'Usuario estudiante' },
    }),
    prisma.rol.upsert({
      where: { id: 2 },
      update: {},
      create: { id: 2, nombre: 'tutor', descripcion: 'Usuario tutor' },
    }),
    prisma.rol.upsert({
      where: { id: 3 },
      update: {},
      create: { id: 3, nombre: 'admin', descripcion: 'Administrador del sistema' },
    }),
  ]);

  // Crear estados de usuario
  const estados = await Promise.all([
    prisma.estadoUsuario.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, nombre: 'activo', descripcion: 'Usuario activo' },
    }),
    prisma.estadoUsuario.upsert({
      where: { id: 2 },
      update: {},
      create: { id: 2, nombre: 'inactivo', descripcion: 'Usuario inactivo' },
    }),
    prisma.estadoUsuario.upsert({
      where: { id: 3 },
      update: {},
      create: { id: 3, nombre: 'suspendido', descripcion: 'Usuario suspendido' },
    }),
  ]);

  console.log('Roles creados:', roles.map(r => r.nombre));
  console.log('Estados creados:', estados.map(e => e.nombre));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
