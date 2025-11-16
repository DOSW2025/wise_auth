/*
  Warnings:

  - The values [pendiente_activacion] on the enum `EstadoUsuario` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `bloqueado_hasta` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_verificacion` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `intentos_fallidos` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `two_factor_habilitado` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `two_factor_secret` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `ultimo_cambio_password` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the `sesiones` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tokens` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[google_id]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EstadoUsuario_new" AS ENUM ('activo', 'inactivo', 'suspendido');
ALTER TABLE "public"."usuarios" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "usuarios" ALTER COLUMN "estado" TYPE "EstadoUsuario_new" USING ("estado"::text::"EstadoUsuario_new");
ALTER TYPE "EstadoUsuario" RENAME TO "EstadoUsuario_old";
ALTER TYPE "EstadoUsuario_new" RENAME TO "EstadoUsuario";
DROP TYPE "public"."EstadoUsuario_old";
ALTER TABLE "usuarios" ALTER COLUMN "estado" SET DEFAULT 'activo';
COMMIT;

-- DropForeignKey
ALTER TABLE "sesiones" DROP CONSTRAINT "sesiones_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "tokens" DROP CONSTRAINT "tokens_usuario_id_fkey";

-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "bloqueado_hasta",
DROP COLUMN "fecha_verificacion",
DROP COLUMN "intentos_fallidos",
DROP COLUMN "password",
DROP COLUMN "two_factor_habilitado",
DROP COLUMN "two_factor_secret",
DROP COLUMN "ultimo_cambio_password",
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "google_id" TEXT,
ALTER COLUMN "estado" SET DEFAULT 'activo';

-- DropTable
DROP TABLE "sesiones";

-- DropTable
DROP TABLE "tokens";

-- DropEnum
DROP TYPE "TipoToken";

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_google_id_key" ON "usuarios"("google_id");
