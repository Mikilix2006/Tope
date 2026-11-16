import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { toISODate } from "@/lib/goals";
import { todayMadrid } from "@/modules/engine";
import { requireUserId } from "@/server/auth/session";
import { isOnboarded } from "@/server/core/onboarding";
import { loadGoalExercises } from "../goal-options";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Alta" };

export default async function AltaPage() {
  const userId = await requireUserId();
  if (await isOnboarded(userId)) redirect("/panel");
  const exercises = await loadGoalExercises(userId);

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold">Cuéntanos de ti</h1>
        <p className="text-muted">Cuatro pasos rápidos para preparar tus objetivos.</p>
      </div>
      <OnboardingForm exercises={exercises} today={toISODate(todayMadrid())} />
    </>
  );
}
