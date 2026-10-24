import type { Metadata } from "next";
import { AccountsView } from "@/modules/accounts";

export const metadata: Metadata = {
  title: "Contas Financeiras - Cifra",
  description: "Gerencie suas contas bancárias, carteiras e acompanhe seus saldos.",
};

export default function AccountsPage() {
  return <AccountsView />;
}
