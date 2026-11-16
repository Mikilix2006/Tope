import type { Discipline, Equipment, ExerciseMetric } from "@prisma/client";
import * as z from "zod";
import { markTrainingDay, unmarkTrainingDay } from "@/server/core/calendar";
import { METRIC_FIELDS, type SetField, type SetValues } from "./fields";
import { exerciseSchema, idSchema, routineSchema, sessionStartSchema, setSchema } from "./schemas";

/*
 * Motor común de los módulos por disciplina. Cada módulo tiene sus propias tablas
 * (<Disciplina>Exercise, Routine, RoutineItem, Session, Set) con los mismos nombres de relación,
 * y aquí se escribe una sola vez la lógica sobre ellas.
 *
 * Aislamiento: toda función recibe el userId de la sesión. Rutinas y sesiones filtran por userId;
 * las series, por session.userId; los ejercicios visibles son los globales (userId null) y los propios.
 */

export type CatalogEntry = { slug: string; name: string; metric: ExerciseMetric; muscle: string; equipment: Equipment };

export type ExerciseRow = {
  id: string;
  slug: string | null;
  name: string;
  metric: ExerciseMetric;
  muscle: string | null;
  equipment: Equipment | null;
  userId: string | null;
};
export type ItemRow = SetValues & { id: string; position: number; exerciseId: string; sets: number; exercise: ExerciseRow };
export type RoutineRow = { id: string; name: string; notes: string | null; updatedAt: Date; items: ItemRow[] };
export type SetRow = SetValues & { id: string; exerciseId: string; createdAt: Date; exercise: ExerciseRow };
export type SessionRow = {
  id: string;
  date: Date;
  notes: string | null;
  routineId: string | null;
  routine: RoutineRow | null;
  sets: SetRow[];
};
export type SessionSummary = { id: string; date: Date; routine: { name: string } | null; _count: { sets: number } };

// Lo mínimo que usamos de un delegado de Prisma (prisma.fuerzaSet, ...). Los tests de módulos cubren los tres.
type Delegate = {
  findMany<T>(args: object): Promise<T[]>;
  findFirst<T>(args: object): Promise<T | null>;
  create<T>(args: object): Promise<T>;
  update<T>(args: object): Promise<T>;
  upsert<T>(args: object): Promise<T>;
  deleteMany(args: object): Promise<{ count: number }>;
  count(args: object): Promise<number>;
};

export type ModuleDef = {
  slug: string;
  discipline: Discipline;
  name: string;
  description: string;
  /** Columnas de serie y de objetivo de rutina de este módulo. */
  fields: readonly SetField[];
  /** Métricas que admite su catálogo. */
  metrics: readonly ExerciseMetric[];
  /** Métricas en las que menos es mejor (p. ej. tiempo de un WOD «por tiempo»). */
  lowerIsBetter: readonly ExerciseMetric[];
  catalog: readonly CatalogEntry[];
  /** Delegados de Prisma de sus cuatro tablas principales (los items se escriben anidados en la rutina). */
  db: { exercise: unknown; routine: unknown; session: unknown; set: unknown };
};

export type Errors = Record<string, string[] | undefined>;
export type Result<T = { id: string }> = ({ ok: true } & T) | { ok: false; errors: Errors };

const fail = (field: string, message: string): { ok: false; errors: Errors } => ({ ok: false, errors: { [field]: [message] } });

// Fecha de hoy en España, como día UTC (las fechas de sesión son @db.Date).
export function todayMadrid(now = new Date()) {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(now);
  return new Date(`${ymd}T00:00:00Z`);
}

const exerciseOrder = [{ muscle: "asc" }, { name: "asc" }];
const routineInclude = { items: { orderBy: { position: "asc" }, include: { exercise: true } } };

export function createModule(def: ModuleDef) {
  const db = def.db as { exercise: Delegate; routine: Delegate; session: Delegate; set: Delegate };
  const visible = (userId: string) => ({ OR: [{ userId: null }, { userId }] });
  const pick = (values: SetValues) => Object.fromEntries(def.fields.map((f) => [f, values[f] ?? null]));

  // Marca o desmarca el día en el calendario del núcleo según queden series ese día en este módulo.
  async function syncTrainingDay(userId: string, date: Date) {
    const sets = await db.set.count({ where: { session: { userId, date } } });
    if (sets > 0) await markTrainingDay(userId, date, def.discipline);
    else await unmarkTrainingDay(userId, date, def.discipline);
  }

  const ownSession = (userId: string, id: string) => db.session.findFirst<{ id: string; date: Date }>({ where: { id, userId } });

  return {
    ...def,

    // ── Catálogo ─────────────────────────────────────────────
    listExercises: (userId: string) => db.exercise.findMany<ExerciseRow>({ where: visible(userId), orderBy: exerciseOrder }),

    getExercise: (userId: string, id: string) => db.exercise.findFirst<ExerciseRow>({ where: { id, ...visible(userId) } }),

    async createExercise(userId: string, input: unknown): Promise<Result> {
      const parsed = exerciseSchema(def.metrics).safeParse(input);
      if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors };
      const ex = await db.exercise.create<{ id: string }>({ data: { ...parsed.data, userId }, select: { id: true } });
      return { ok: true, id: ex.id };
    },

    // Idempotente: crea o actualiza cada ejercicio del catálogo global por su slug.
    async seedCatalog() {
      for (const { slug, ...data } of def.catalog) {
        await db.exercise.upsert({ where: { slug }, create: { slug, ...data }, update: data });
      }
    },

    // ── Rutinas ──────────────────────────────────────────────
    listRoutines: (userId: string) =>
      db.routine.findMany<RoutineRow>({ where: { userId }, orderBy: { updatedAt: "desc" }, include: routineInclude }),

    getRoutine: (userId: string, id: string) => db.routine.findFirst<RoutineRow>({ where: { id, userId }, include: routineInclude }),

    /** Crea (sin routineId) o reemplaza entera una rutina. Solo admite ejercicios visibles para el usuario. */
    async saveRoutine(userId: string, input: unknown, routineId?: string): Promise<Result> {
      const parsed = routineSchema(def.fields).safeParse(input);
      if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors };
      const { name, notes, items } = parsed.data;

      const ids = [...new Set(items.map((i) => i.exerciseId))];
      const found = await db.exercise.count({ where: { id: { in: ids }, ...visible(userId) } });
      if (found !== ids.length) return fail("items", "Hay ejercicios que no existen en el catálogo.");

      const create = items.map((item, position) => ({ position, exerciseId: item.exerciseId, sets: item.sets, ...pick(item) }));
      const data = { name, notes: notes ?? null };

      if (!routineId) {
        const r = await db.routine.create<{ id: string }>({ data: { ...data, userId, items: { create } }, select: { id: true } });
        return { ok: true, id: r.id };
      }
      if (!(await db.routine.findFirst({ where: { id: routineId, userId } }))) return fail("form", "La rutina no existe.");
      await db.routine.update({ where: { id: routineId }, data: { ...data, items: { deleteMany: {}, create } } });
      return { ok: true, id: routineId };
    },

    async deleteRoutine(userId: string, id: string) {
      return (await db.routine.deleteMany({ where: { id, userId } })).count === 1;
    },

    // ── Sesiones y series ────────────────────────────────────
    async startSession(userId: string, input: unknown): Promise<Result> {
      const parsed = sessionStartSchema.safeParse(input);
      if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors };
      const { routineId, date } = parsed.data;
      if (routineId && !(await db.routine.findFirst({ where: { id: routineId, userId } }))) return fail("routineId", "La rutina no existe.");
      const s = await db.session.create<{ id: string }>({
        data: { userId, routineId: routineId ?? null, date: date ? new Date(`${date}T00:00:00Z`) : todayMadrid() },
        select: { id: true },
      });
      return { ok: true, id: s.id };
    },

    listSessions: (userId: string, take = 20) =>
      db.session.findMany<SessionSummary>({
        where: { userId },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take,
        select: { id: true, date: true, routine: { select: { name: true } }, _count: { select: { sets: true } } },
      }),

    getSession: (userId: string, id: string) =>
      db.session.findFirst<SessionRow>({
        where: { id, userId },
        include: { routine: { include: routineInclude }, sets: { orderBy: { createdAt: "asc" }, include: { exercise: true } } },
      }),

    async deleteSession(userId: string, id: string) {
      const s = await ownSession(userId, id);
      if (!s) return false;
      await db.session.deleteMany({ where: { id, userId } });
      await syncTrainingDay(userId, s.date);
      return true;
    },

    async addSet(userId: string, sessionId: string, exerciseId: unknown, values: unknown): Promise<Result> {
      const exId = idSchema.safeParse(exerciseId);
      const session = await ownSession(userId, sessionId);
      if (!session) return fail("form", "La sesión no existe.");
      const exercise = exId.success ? await db.exercise.findFirst<ExerciseRow>({ where: { id: exId.data, ...visible(userId) } }) : null;
      if (!exercise) return fail("form", "El ejercicio no existe.");

      const parsed = setSchema(def.fields, exercise.metric).safeParse(values);
      if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors };
      const set = await db.set.create<{ id: string }>({ data: { sessionId, exerciseId: exercise.id, ...parsed.data }, select: { id: true } });
      await syncTrainingDay(userId, session.date);
      return { ok: true, id: set.id };
    },

    async deleteSet(userId: string, setId: string) {
      const set = await db.set.findFirst<{ session: { date: Date } }>({
        where: { id: setId, session: { userId } },
        select: { session: { select: { date: true } } },
      });
      if (!set) return false;
      await db.set.deleteMany({ where: { id: setId, session: { userId } } });
      await syncTrainingDay(userId, set.session.date);
      return true;
    },

    /** Última serie registrada de cada ejercicio (para rellenar el formulario y registrar con un toque). */
    async lastSets(userId: string, exerciseIds: string[]) {
      if (!exerciseIds.length) return new Map<string, SetRow>();
      const rows = await db.set.findMany<SetRow>({
        where: { exerciseId: { in: exerciseIds }, session: { userId } },
        orderBy: [{ exerciseId: "asc" }, { createdAt: "desc" }],
        distinct: ["exerciseId"],
        include: { exercise: true },
      });
      return new Map(rows.map((r) => [r.exerciseId, r]));
    },

    /**
     * Valor actual de un objetivo de ejercicio: la mejor serie de la última sesión (desde `since`) en la que
     * aparece. Se mide en el campo principal de la métrica (kg, repeticiones, segundos, metros). null si no hay.
     */
    async latestBest(userId: string, exerciseId: string, metric: ExerciseMetric, since: Date): Promise<number | null> {
      const field = METRIC_FIELDS[metric].required[0];
      const last = await db.session.findFirst<{ id: string }>({
        where: { userId, date: { gte: since }, sets: { some: { exerciseId } } },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        select: { id: true },
      });
      if (!last) return null;
      const sets = await db.set.findMany<SetValues>({ where: { sessionId: last.id, exerciseId }, select: { [field]: true } });
      const values = sets.map((s) => s[field]).filter((v): v is number => v != null);
      if (!values.length) return null;
      return def.lowerIsBetter.includes(metric) ? Math.min(...values) : Math.max(...values);
    },
  };
}

export type Module = ReturnType<typeof createModule>;
