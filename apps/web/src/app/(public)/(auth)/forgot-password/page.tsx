import type { Metadata } from "next";
import { RecoveryWizard } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Recuperar senha - Cifra",
  description: "Recupere o acesso à sua conta no Cifra.",
};

export default function ForgotPasswordPage() {
  return <RecoveryWizard />;
}
