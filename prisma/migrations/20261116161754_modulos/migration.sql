-- CreateEnum
CREATE TYPE "ExerciseMetric" AS ENUM ('PESO', 'REPETICIONES', 'TIEMPO', 'DISTANCIA', 'CALORIAS');

-- CreateTable
CREATE TABLE "FuerzaExercise" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "name" TEXT NOT NULL,
    "metric" "ExerciseMetric" NOT NULL,
    "muscle" TEXT,
    "equipment" "Equipment",
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuerzaExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuerzaRoutine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuerzaRoutine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuerzaRoutineItem" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "reps" INTEGER,
    "rpe" DOUBLE PRECISION,

    CONSTRAINT "FuerzaRoutineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuerzaSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "routineId" TEXT,
    "date" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuerzaSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuerzaSet" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "rpe" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuerzaSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalisteniaExercise" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "name" TEXT NOT NULL,
    "metric" "ExerciseMetric" NOT NULL,
    "muscle" TEXT,
    "equipment" "Equipment",
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalisteniaExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalisteniaRoutine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalisteniaRoutine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalisteniaRoutineItem" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER,
    "seconds" INTEGER,
    "weightKg" DOUBLE PRECISION,

    CONSTRAINT "CalisteniaRoutineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalisteniaSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "routineId" TEXT,
    "date" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalisteniaSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalisteniaSet" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "reps" INTEGER,
    "seconds" INTEGER,
    "weightKg" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalisteniaSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrossfitExercise" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "name" TEXT NOT NULL,
    "metric" "ExerciseMetric" NOT NULL,
    "muscle" TEXT,
    "equipment" "Equipment",
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrossfitExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrossfitRoutine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrossfitRoutine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrossfitRoutineItem" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER,
    "weightKg" DOUBLE PRECISION,
    "seconds" INTEGER,
    "meters" INTEGER,
    "calories" INTEGER,

    CONSTRAINT "CrossfitRoutineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrossfitSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "routineId" TEXT,
    "date" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrossfitSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrossfitSet" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "reps" INTEGER,
    "weightKg" DOUBLE PRECISION,
    "seconds" INTEGER,
    "meters" INTEGER,
    "calories" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrossfitSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FuerzaExercise_slug_key" ON "FuerzaExercise"("slug");

-- CreateIndex
CREATE INDEX "FuerzaExercise_userId_idx" ON "FuerzaExercise"("userId");

-- CreateIndex
CREATE INDEX "FuerzaRoutine_userId_idx" ON "FuerzaRoutine"("userId");

-- CreateIndex
CREATE INDEX "FuerzaRoutineItem_routineId_idx" ON "FuerzaRoutineItem"("routineId");

-- CreateIndex
CREATE INDEX "FuerzaSession_userId_date_idx" ON "FuerzaSession"("userId", "date");

-- CreateIndex
CREATE INDEX "FuerzaSet_sessionId_idx" ON "FuerzaSet"("sessionId");

-- CreateIndex
CREATE INDEX "FuerzaSet_exerciseId_idx" ON "FuerzaSet"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "CalisteniaExercise_slug_key" ON "CalisteniaExercise"("slug");

-- CreateIndex
CREATE INDEX "CalisteniaExercise_userId_idx" ON "CalisteniaExercise"("userId");

-- CreateIndex
CREATE INDEX "CalisteniaRoutine_userId_idx" ON "CalisteniaRoutine"("userId");

-- CreateIndex
CREATE INDEX "CalisteniaRoutineItem_routineId_idx" ON "CalisteniaRoutineItem"("routineId");

-- CreateIndex
CREATE INDEX "CalisteniaSession_userId_date_idx" ON "CalisteniaSession"("userId", "date");

-- CreateIndex
CREATE INDEX "CalisteniaSet_sessionId_idx" ON "CalisteniaSet"("sessionId");

-- CreateIndex
CREATE INDEX "CalisteniaSet_exerciseId_idx" ON "CalisteniaSet"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "CrossfitExercise_slug_key" ON "CrossfitExercise"("slug");

-- CreateIndex
CREATE INDEX "CrossfitExercise_userId_idx" ON "CrossfitExercise"("userId");

-- CreateIndex
CREATE INDEX "CrossfitRoutine_userId_idx" ON "CrossfitRoutine"("userId");

-- CreateIndex
CREATE INDEX "CrossfitRoutineItem_routineId_idx" ON "CrossfitRoutineItem"("routineId");

-- CreateIndex
CREATE INDEX "CrossfitSession_userId_date_idx" ON "CrossfitSession"("userId", "date");

-- CreateIndex
CREATE INDEX "CrossfitSet_sessionId_idx" ON "CrossfitSet"("sessionId");

-- CreateIndex
CREATE INDEX "CrossfitSet_exerciseId_idx" ON "CrossfitSet"("exerciseId");

-- AddForeignKey
ALTER TABLE "FuerzaExercise" ADD CONSTRAINT "FuerzaExercise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuerzaRoutine" ADD CONSTRAINT "FuerzaRoutine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuerzaRoutineItem" ADD CONSTRAINT "FuerzaRoutineItem_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "FuerzaRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuerzaRoutineItem" ADD CONSTRAINT "FuerzaRoutineItem_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "FuerzaExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuerzaSession" ADD CONSTRAINT "FuerzaSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuerzaSession" ADD CONSTRAINT "FuerzaSession_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "FuerzaRoutine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuerzaSet" ADD CONSTRAINT "FuerzaSet_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "FuerzaSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuerzaSet" ADD CONSTRAINT "FuerzaSet_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "FuerzaExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalisteniaExercise" ADD CONSTRAINT "CalisteniaExercise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalisteniaRoutine" ADD CONSTRAINT "CalisteniaRoutine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalisteniaRoutineItem" ADD CONSTRAINT "CalisteniaRoutineItem_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "CalisteniaRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalisteniaRoutineItem" ADD CONSTRAINT "CalisteniaRoutineItem_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "CalisteniaExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalisteniaSession" ADD CONSTRAINT "CalisteniaSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalisteniaSession" ADD CONSTRAINT "CalisteniaSession_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "CalisteniaRoutine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalisteniaSet" ADD CONSTRAINT "CalisteniaSet_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CalisteniaSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalisteniaSet" ADD CONSTRAINT "CalisteniaSet_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "CalisteniaExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrossfitExercise" ADD CONSTRAINT "CrossfitExercise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrossfitRoutine" ADD CONSTRAINT "CrossfitRoutine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrossfitRoutineItem" ADD CONSTRAINT "CrossfitRoutineItem_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "CrossfitRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrossfitRoutineItem" ADD CONSTRAINT "CrossfitRoutineItem_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "CrossfitExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrossfitSession" ADD CONSTRAINT "CrossfitSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrossfitSession" ADD CONSTRAINT "CrossfitSession_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "CrossfitRoutine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrossfitSet" ADD CONSTRAINT "CrossfitSet_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CrossfitSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrossfitSet" ADD CONSTRAINT "CrossfitSet_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "CrossfitExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
