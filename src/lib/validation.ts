import * as z from "zod";

// Toda entrada que llega al servidor pasa por uno de estos esquemas.

// Mensajes por defecto de Zod en español.
z.config(z.locales.es());

// Se recorta y pasa a minúsculas ANTES de validar (en Zod 4, z.email().trim() valida primero).
const email = z.string().trim().toLowerCase().max(254).pipe(z.email({ error: "Escribe un email válido." }));

export const registerSchema = z.object({
  name: z.string().trim().min(2, { error: "El nombre debe tener al menos 2 caracteres." }).max(60),
  email,
  password: z
    .string()
    .min(8, { error: "La contraseña debe tener al menos 8 caracteres." })
    .max(128, { error: "La contraseña no puede pasar de 128 caracteres." }),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

// Los formularios envían "" en los campos vacíos: se tratan como "sin dato".
const optionalInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().min(min).max(max).optional());

const optionalNumber = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().min(min).max(max).optional());

export const disciplineSchema = z.enum(["CALISTENIA", "CROSSFIT", "FUERZA"]);
export const levelSchema = z.enum(["PRINCIPIANTE", "INTERMEDIO", "AVANZADO"]);
export const equipmentSchema = z.enum(["SIN_MATERIAL", "MANCUERNAS", "GIMNASIO"]);

export const profileSchema = z.object({
  age: optionalInt(12, 100),
  disciplines: z.array(disciplineSchema).max(3).default([]),
  level: levelSchema.optional(),
  daysPerWeek: optionalInt(1, 7),
  sessionMinutes: optionalInt(10, 240),
  equipment: equipmentSchema.optional(),
  limitations: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(500).optional(),
  ),
});

export const measurementSchema = z
  .object({
    date: z.iso.date({ error: "Fecha no válida." }),
    weightKg: optionalNumber(20, 400),
    heightCm: optionalNumber(80, 250),
    waistCm: optionalNumber(30, 250),
    chestCm: optionalNumber(30, 250),
    hipCm: optionalNumber(30, 250),
    armCm: optionalNumber(10, 100),
    thighCm: optionalNumber(20, 150),
  })
  .refine((m) => Object.entries(m).some(([k, v]) => k !== "date" && v !== undefined), {
    error: "Introduce al menos una medida.",
  });

// ─── Objetivos ───────────────────────────────────────────────
export const difficultySchema = z.enum(["FACIL", "MEDIO", "DIFICIL"], { error: "Elige una dificultad." });
const bodyMetricSchema = z.enum(["PESO_CORPORAL", "CINTURA", "PECHO", "CADERA", "BRAZO", "MUSLO"], { error: "Elige una medida." });
const goalValue = z.coerce.number().min(0).max(100_000);
const optionalGoalValue = z.preprocess((v) => (v === "" || v == null ? undefined : v), goalValue.optional());
const optionalDate = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.iso.date({ error: "Fecha no válida." }).optional());
const exerciseRef = { discipline: disciplineSchema, exerciseId: z.string().min(1, { error: "Elige un ejercicio." }).max(40) };

// Sin targetValue se usa la meta sugerida por la dificultad. El valor actual nunca lo envía el cliente.
export const goalSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("ejercicio"),
    ...exerciseRef,
    difficulty: difficultySchema,
    startValue: goalValue,
    targetValue: optionalGoalValue,
    deadline: optionalDate,
  }),
  z.object({
    kind: z.literal("medida"),
    metric: bodyMetricSchema,
    direction: z.enum(["SUBIR", "BAJAR"], { error: "Elige si quieres subir o bajar." }),
    difficulty: difficultySchema,
    startValue: goalValue.refine((v) => v > 0, { error: "Introduce tu medida actual." }),
    targetValue: optionalGoalValue,
    deadline: optionalDate,
  }),
]);

export const goalUpdateSchema = z.object({ difficulty: difficultySchema, targetValue: optionalGoalValue, deadline: optionalDate });

// Asistente de alta: los cuatro pasos se validan juntos al terminar.
export const onboardingSchema = z
  .object({
    heightCm: z.coerce.number().min(80).max(250),
    weightKg: z.coerce.number().min(20).max(400),
    age: z.coerce.number().int().min(12).max(100),
    disciplines: z.array(disciplineSchema).min(1, { error: "Elige al menos una disciplina." }).max(3),
    level: levelSchema,
    daysPerWeek: z.coerce.number().int().min(1).max(7),
    sessionMinutes: z.coerce.number().int().min(10).max(240),
    equipment: equipmentSchema,
    limitations: profileSchema.shape.limitations,
    marks: z.array(z.object({ ...exerciseRef, value: goalValue, difficulty: difficultySchema })).max(10).default([]),
  })
  .refine((o) => o.marks.every((m) => o.disciplines.includes(m.discipline)), {
    error: "Las marcas deben ser de las disciplinas elegidas.",
    path: ["marks"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type MeasurementInput = z.infer<typeof measurementSchema>;
