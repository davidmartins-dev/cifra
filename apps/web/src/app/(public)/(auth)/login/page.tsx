import type { Metadata } from "next";
import { LoginForm } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Acesse sua conta - Cifra",
  description: "Entre com seu e-mail e senha no Cifra.",
};

export default function LoginPage() {
  return <LoginForm />;
}
