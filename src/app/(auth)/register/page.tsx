import type { Metadata } from "next";
import { PlayerAuthForm } from "@/components/auth/player-auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return <PlayerAuthForm mode="register" />;
}
