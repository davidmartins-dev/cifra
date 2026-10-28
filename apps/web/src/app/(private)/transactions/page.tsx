import type { Metadata } from "next";
import { TransactionsView } from "@/modules/transactions";

export const metadata: Metadata = {
  title: "Transações - Cifra",
  description: "Gerencie suas receitas e despesas com controle financeiro completo.",
};

export default function TransactionsPage() {
  return <TransactionsView />;
}
