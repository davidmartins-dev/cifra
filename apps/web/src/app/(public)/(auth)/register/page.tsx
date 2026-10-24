import type { Metadata } from "next";
import { RegisterWizard } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Crie sua conta - Cifra",
  description: "Abra sua conta gratuitamente e assuma o controle da sua vida financeira.",
};

export default function RegisterPage() {
  return <RegisterWizard />;
}
