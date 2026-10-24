import type { Metadata } from "next";
import { RecoveryWizard } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Redefinir senha - Cifra",
  description: "Redefina a senha da sua conta no Cifra.",
};

export default function ResetPasswordPage() {
  return <RecoveryWizard />;
}
