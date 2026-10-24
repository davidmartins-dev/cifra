"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Spinner } from "@repo/ui/spinner";
import { toast } from "@repo/ui/toast";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "../../schemas/auth.schema";
import { useResetPasswordMutation } from "../../hooks/use-auth-mutations";

interface RecoveryPasswordStepProps {
  email: string;
  verificationTicket: string;
}

export function RecoveryPasswordStep({
  email,
  verificationTicket,
}: RecoveryPasswordStepProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = useWatch({ control, name: "password" }) || "";
  const confirmPasswordValue = useWatch({ control, name: "confirmPassword" }) || "";
  const passwordsMatch = passwordValue.length > 0 && passwordValue === confirmPasswordValue;

  // Validações visuais de força da senha
  const passwordRequirements = [
    { label: "Mínimo 8 caracteres", met: passwordValue.length >= 8 },
    { label: "Maiúsculas e minúsculas", met: /[A-Z]/.test(passwordValue) && /[a-z]/.test(passwordValue) },
    { label: "Pelo menos 1 número", met: /[0-9]/.test(passwordValue) },
    { label: "Caractere especial (!@#$)", met: /[^A-Za-z0-9]/.test(passwordValue) },
    { label: "Senhas coincidem", met: passwordsMatch, colSpan: true },
  ];

  const resetMutation = useResetPasswordMutation({
    onSuccess: () => {
      toast.add({
        title: "Senha redefinida!",
        description: "Sua senha foi alterada com sucesso. Faça login com suas novas credenciais.",
        type: "success",
      });
      router.push("/login");
    },
    onError: (error: Error) => {
      setErrorMessage(
        error.message || "Erro ao redefinir senha. Tente novamente."
      );
      toast.add({
        title: "Erro ao alterar senha",
        description: error.message || "Não foi possível concluir a redefinição.",
        type: "error",
      });
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    setErrorMessage(null);
    resetMutation.mutate({
      email,
      password: data.password,
      verificationTicket,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-bold tracking-tight">
          Criar nova senha
        </CardTitle>
        <CardDescription className="text-sm">
          Escolha uma senha forte e segura para a sua conta.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2"
          >
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="new-password">Nova senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              disabled={resetMutation.isPending}
              className="pl-9 pr-10"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-new-password">Confirmar nova senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="confirm-new-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              disabled={resetMutation.isPending}
              className="pl-9 pr-10"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label={showConfirmPassword ? "Ocultar senha" : "Ver senha"}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive font-medium">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Indicadores de requisitos de senha */}
        <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Requisitos da senha:
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {passwordRequirements.map((req, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  req.colSpan ? "col-span-2" : ""
                } ${
                  req.met
                    ? "text-emerald-500 font-medium"
                    : "text-muted-foreground"
                }`}
              >
                <CheckCircle2
                  className={`h-3.5 w-3.5 ${
                    req.met ? "text-emerald-500" : "text-muted-foreground/40"
                  }`}
                />
                <span>{req.label}</span>
              </div>
            ))}
          </div>
        </div>

      </CardContent>

      <CardFooter>
        <Button
          size="lg"
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          disabled={resetMutation.isPending || !passwordsMatch || passwordValue.length < 8}
        >
          {resetMutation.isPending ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Redefinindo senha...
            </>
          ) : (
            "Concluir redefinição"
          )}
        </Button>
      </CardFooter>
    </form>
  );
}
