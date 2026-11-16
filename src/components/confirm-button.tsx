"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui";

// Botón de envío que pide confirmación antes de borrar.
export function ConfirmButton({ message, ...props }: ComponentProps<typeof Button> & { message: string }) {
  return <Button type="submit" variant="ghost" onClick={(e) => !window.confirm(message) && e.preventDefault()} {...props} />;
}
