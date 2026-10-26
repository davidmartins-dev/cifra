import type { Metadata } from "next";
import { CategoriesView } from "@/modules/categories";

export const metadata: Metadata = {
  title: "Categorias - Cifra",
  description: "Gerencie suas categorias de receitas e despesas no Cifra.",
};

export default function CategoriesPage() {
  return <CategoriesView />;
}
