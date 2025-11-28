-- CreateEnum
CREATE TYPE "EstadoSesion" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "Modalidad" AS ENUM ('VIRTUAL', 'PRESENCIAL');

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "asunto" TEXT NOT NULL,
    "resumen" TEXT NOT NULL,
    "visto" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id","userId")
);

-- CreateTable
CREATE TABLE "tutor_profile" (
    "id_tutor" TEXT NOT NULL,
    "bio" TEXT,
    "reputacion" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "tutor_profile_pkey" PRIMARY KEY ("id_tutor")
);

-- CreateTable
CREATE TABLE "materia" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "materia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tema" (
    "id" TEXT NOT NULL,
    "materiaId" TEXT NOT NULL,
    "nombreTema" TEXT NOT NULL,

    CONSTRAINT "tema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_materia" (
    "id" SERIAL NOT NULL,
    "tutorId" TEXT NOT NULL,
    "materiaId" TEXT NOT NULL,

    CONSTRAINT "tutor_materia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutoria" (
    "id_tutoria" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "materiaId" TEXT NOT NULL,
    "codigoMateria" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "day" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "mode" "Modalidad" NOT NULL,
    "status" "EstadoSesion" NOT NULL DEFAULT 'PENDIENTE',
    "linkConexion" TEXT,
    "lugar" TEXT,
    "comentarios" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutoria_pkey" PRIMARY KEY ("id_tutoria")
);

-- CreateTable
CREATE TABLE "rating" (
    "id" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rating_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "estados_usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estados_usuario_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT,
    "biografia" TEXT,
    "semestre" INTEGER NOT NULL DEFAULT 1,
    "google_id" TEXT,
    "avatar_url" TEXT,
    "rol_id" INTEGER NOT NULL DEFAULT 1,
    "estado_id" INTEGER NOT NULL DEFAULT 1,
    "ultimo_login" TIMESTAMP(3),
    "disponibilidad" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Materiales" (
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

    CONSTRAINT "Materiales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resumen" (
    "id" SERIAL NOT NULL,
    "idMaterial" TEXT NOT NULL,
    "resumen" TEXT NOT NULL,

    CONSTRAINT "Resumen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notifications_id_key" ON "notifications"("id");

-- CreateIndex
CREATE UNIQUE INDEX "materia_codigo_key" ON "materia"("codigo");

-- CreateIndex
CREATE INDEX "materia_codigo_idx" ON "materia"("codigo");

-- CreateIndex
CREATE INDEX "tema_materiaId_idx" ON "tema"("materiaId");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_materia_tutorId_materiaId_key" ON "tutor_materia"("tutorId", "materiaId");

-- CreateIndex
CREATE INDEX "tutoria_tutorId_scheduledAt_idx" ON "tutoria"("tutorId", "scheduledAt");

-- CreateIndex
CREATE INDEX "tutoria_materiaId_idx" ON "tutoria"("materiaId");

-- CreateIndex
CREATE INDEX "tutoria_codigoMateria_idx" ON "tutoria"("codigoMateria");

-- CreateIndex
CREATE INDEX "tutoria_status_idx" ON "tutoria"("status");

-- CreateIndex
CREATE UNIQUE INDEX "rating_sessionId_key" ON "rating"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "estados_usuario_nombre_key" ON "estados_usuario"("nombre");

-- CreateIndex
CREATE INDEX "MaterialTags_idMaterial_idx" ON "MaterialTags"("idMaterial");

-- CreateIndex
CREATE UNIQUE INDEX "Tags_tag_key" ON "Tags"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_google_id_key" ON "usuarios"("google_id");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_estado_id_idx" ON "usuarios"("estado_id");

-- CreateIndex
CREATE INDEX "usuarios_rol_id_idx" ON "usuarios"("rol_id");

-- CreateIndex
CREATE UNIQUE INDEX "Materiales_hash_key" ON "Materiales"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_profile" ADD CONSTRAINT "tutor_profile_id_tutor_fkey" FOREIGN KEY ("id_tutor") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tema" ADD CONSTRAINT "tema_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "materia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_materia" ADD CONSTRAINT "tutor_materia_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "materia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_materia" ADD CONSTRAINT "tutor_materia_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "tutor_profile"("id_tutor") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoria" ADD CONSTRAINT "tutoria_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "materia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoria" ADD CONSTRAINT "tutoria_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoria" ADD CONSTRAINT "tutoria_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating" ADD CONSTRAINT "rating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating" ADD CONSTRAINT "rating_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "tutoria"("id_tutoria") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating" ADD CONSTRAINT "rating_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "tutor_profile"("id_tutor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calificaciones" ADD CONSTRAINT "Calificaciones_idMaterial_fkey" FOREIGN KEY ("idMaterial") REFERENCES "Materiales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialTags" ADD CONSTRAINT "MaterialTags_idMaterial_fkey" FOREIGN KEY ("idMaterial") REFERENCES "Materiales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialTags" ADD CONSTRAINT "MaterialTags_idTag_fkey" FOREIGN KEY ("idTag") REFERENCES "Tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estados_usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Materiales" ADD CONSTRAINT "Materiales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resumen" ADD CONSTRAINT "Resumen_idMaterial_fkey" FOREIGN KEY ("idMaterial") REFERENCES "Materiales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
