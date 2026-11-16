import bcrypt from "bcryptjs";

const COST = 12;

export const hashPassword = (password: string) => bcrypt.hash(password, COST);
export const checkPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

// Hash de una contraseña cualquiera: si el email no existe se compara igualmente, para no revelar por el tiempo de respuesta qué cuentas existen.
export const DUMMY_HASH = bcrypt.hashSync("tope-dummy-password", COST);
