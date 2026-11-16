// Formatos en español. Las fechas de sesión y medida son días UTC (@db.Date): se formatean en UTC.
const day = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const short = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "UTC" });

export const formatDay = (d: Date) => day.format(d);
export const formatShortDay = (d: Date) => short.format(d);
export const formatSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
