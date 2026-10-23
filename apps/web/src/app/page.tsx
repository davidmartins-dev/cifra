import Link from "next/link";
import { ArrowRight, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import { Logo } from "@repo/ui/logo";
import { buttonVariants } from "@repo/ui/button";
import { cn } from "@repo/ui/utils";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              )}
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-6">
          <ShieldCheck className="h-3.5 w-3.5" />
          Gestão financeira simples, inteligente e segura
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 bg-linear-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
          Assuma o controle total do seu patrimônio com o Cifra
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Gerencie suas contas, categorize transações em tempo real e obtenha resumos financeiros detalhados para tomar as melhores decisões.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white p-4 font-semibold shadow-lg shadow-emerald-500/20"
            )}
          >
            Começar gratuitamente
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full p-4 sm:w-auto font-medium"
            )}
          >
            Já tenho uma conta
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 text-left w-full">
          <div className="rounded-xl border border-border/50 bg-card/60 p-6 backdrop-blur-xs">
            <Wallet className="h-6 w-6 text-emerald-500 mb-3" />
            <h2 className="font-semibold text-base mb-1">Múltiplas Contas</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Monitore saldos e extratos de contas correntes, investimentos e cartões em um painel unificado.
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/60 p-6 backdrop-blur-xs">
            <TrendingUp className="h-6 w-6 text-emerald-500 mb-3" />
            <h2 className="font-semibold text-base mb-1">Resumo Inteligente</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Visualize receitas, despesas e taxa de poupança mensal com gráficos e métricas consolidadas.
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/60 p-6 backdrop-blur-xs">
            <ShieldCheck className="h-6 w-6 text-emerald-500 mb-3" />
            <h2 className="font-semibold text-base mb-1">Segurança de Ponta</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Autenticação segura via cookies HttpOnly com proteção robusta de auditoria e privacidade.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Cifra. Todos os direitos reservados.
      </footer>
    </div>
  );
}
