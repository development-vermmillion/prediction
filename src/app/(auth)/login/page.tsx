import type { Metadata } from "next";
import { PlayerAuthForm } from "@/components/auth/player-auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return <PlayerAuthForm mode="login" />;
}
