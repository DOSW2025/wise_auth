/*
  Warnings:

  - You are about to drop the `estados_usuario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usuarios` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_userId_fkey";

-- DropForeignKey
ALTER TABLE "rating" DROP CONSTRAINT "rating_raterId_fkey";

-- DropForeignKey
ALTER TABLE "tutor_profile" DROP CONSTRAINT "tutor_profile_id_tutor_fkey";

-- DropForeignKey
ALTER TABLE "tutoria" DROP CONSTRAINT "tutoria_studentId_fkey";

-- DropForeignKey
ALTER TABLE "tutoria" DROP CONSTRAINT "tutoria_tutorId_fkey";

-- DropForeignKey
ALTER TABLE "usuarios" DROP CONSTRAINT "usuarios_estado_id_fkey";

-- DropForeignKey
ALTER TABLE "usuarios" DROP CONSTRAINT "usuarios_rol_id_fkey";

-- DropTable
DROP TABLE "estados_usuario";

-- DropTable
DROP TABLE "roles";

-- DropTable
DROP TABLE "usuarios";

-- CreateTable
CREATE TABLE "Calificaciones" (
    "id" SERIAL NOT NULL,
    "idMaterial" TEXT NOT NULL,
    "calificacion" INTEGER NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Calificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstadoUsuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstadoUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialTags" (
    "idTag" INTEGER NOT NULL,
    "idMaterial" TEXT NOT NULL,

    CONSTRAINT "MaterialTags_pkey" PRIMARY KEY ("idTag","idMaterial")
);

-- CreateTable
CREATE TABLE "Tags" (
    "id" SERIAL NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "Tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT,
    "semestre" INTEGER NOT NULL DEFAULT 1,
    "ultimo_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "avatar_url" TEXT,
    "google_id" TEXT,
    "estado_id" INTEGER NOT NULL DEFAULT 1,
    "rol_id" INTEGER NOT NULL DEFAULT 1,
    "biografia" TEXT,
    "disponibilidad" JSONB,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "descripcion" TEXT,
    "vistos" INTEGER NOT NULL DEFAULT 0,
    "descargas" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hash" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materiales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumen" (
    "id" SERIAL NOT NULL,
    "idMaterial" TEXT NOT NULL,
    "resumen" TEXT NOT NULL,

    CONSTRAINT "resumen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rol_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EstadoUsuario_nombre_key" ON "EstadoUsuario"("nombre");

-- CreateIndex
CREATE INDEX "MaterialTags_idMaterial_idx" ON "MaterialTags"("idMaterial");

-- CreateIndex
CREATE UNIQUE INDEX "Tags_tag_key" ON "Tags"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_google_id_key" ON "Usuario"("google_id");

-- CreateIndex
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_estado_id_idx" ON "Usuario"("estado_id");

-- CreateIndex
CREATE INDEX "Usuario_rol_id_idx" ON "Usuario"("rol_id");

-- CreateIndex
CREATE UNIQUE INDEX "materiales_hash_key" ON "materiales"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "rol_nombre_key" ON "rol"("nombre");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_profile" ADD CONSTRAINT "tutor_profile_id_tutor_fkey" FOREIGN KEY ("id_tutor") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoria" ADD CONSTRAINT "tutoria_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoria" ADD CONSTRAINT "tutoria_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating" ADD CONSTRAINT "rating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calificaciones" ADD CONSTRAINT "Calificaciones_idMaterial_fkey" FOREIGN KEY ("idMaterial") REFERENCES "materiales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialTags" ADD CONSTRAINT "MaterialTags_idMaterial_fkey" FOREIGN KEY ("idMaterial") REFERENCES "materiales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialTags" ADD CONSTRAINT "MaterialTags_idTag_fkey" FOREIGN KEY ("idTag") REFERENCES "Tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "EstadoUsuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales" ADD CONSTRAINT "materiales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumen" ADD CONSTRAINT "resumen_idMaterial_fkey" FOREIGN KEY ("idMaterial") REFERENCES "materiales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
