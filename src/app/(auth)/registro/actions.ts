"use server";

import { registerUser, type RegisterResult } from "@/server/auth/register";

export async function registerAction(form: FormData): Promise<RegisterResult> {
  return registerUser({ name: form.get("name"), email: form.get("email"), password: form.get("password") });
}
