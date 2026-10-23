"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, EyeOff, Lock, User as UserIcon } from "lucide-react";
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
import { useRegisterMutation } from "../../hooks/use-auth-mutations";
import { passwordStepSchema, type PasswordStepFormData } from "../../schemas/auth.schema";

interface PasswordStepProps {
  email: string;
  verificationTicket: string;
}

export function PasswordStep({ email, verificationTicket }: PasswordStepProps) {
  const router = useRouter();

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const {
    register: formRegister,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PasswordStepFormData>({
    resolver: zodResolver(passwordStepSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  const watchedPassword = useWatch({ control, name: "password" }) || "";
  const watchedConfirmPassword = useWatch({ control, name: "confirmPassword" }) || "";
  const watchedName = useWatch({ control, name: "name" }) || "";

  // Requisitos de senha em tempo real
  const hasMinLength = watchedPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(watchedPassword);
  const hasLowercase = /[a-z]/.test(watchedPassword);
  const hasNumber = /[0-9]/.test(watchedPassword);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(watchedPassword);
  const passwordsMatch = watchedPassword.length > 0 && watchedPassword === watchedConfirmPassword;

  const registerMutation = useRegisterMutation({
    onSuccess: () => {
      toast.add({
        title: "Conta criada com sucesso!",
        description: "Você já está conectado. Redirecionando...",
        type: "success",
      });
      router.push("/dashboard");
    },
    onError: (error: Error) => {
      const message =
        error.message || "Erro ao concluir cadastro. Tente novamente.";
      setErrorMessage(message);
      toast.add({
        title: "Erro no cadastro",
        description: message,
        type: "error",
      });
    },
  });

  const onSubmit = (data: PasswordStepFormData) => {
    setErrorMessage(null);
    registerMutation.mutate({
      name: data.name.trim(),
      email,
      password: data.password,
      verificationTicket,
    });
  };

  return (
    <>
      <CardHeader className="space-y-1.5 pb-6 text-center sm:text-left">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Configure seu perfil
        </CardTitle>
        <CardDescription>
          Finalize seu cadastro definindo seu nome e uma senha segura.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div
              role="alert"
              className="p-3 text-sm rounded-md bg-destructive/10 border border-destructive/20 text-destructive font-medium animate-in fade-in-50"
            >
              {errorMessage}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="signup-name">Nome completo</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="signup-name"
                type="text"
                autoComplete="name"
                placeholder="Ex: David Martins"
                disabled={registerMutation.isPending}
                className="pl-9"
                aria-invalid={!!errors.name}
                {...formRegister("name")}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-destructive font-medium">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                disabled={registerMutation.isPending}
                className="pl-9 pr-10"
                aria-invalid={!!errors.password}
                {...formRegister("password")}
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
            <Label htmlFor="signup-confirm-password">Confirmar senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="signup-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repita sua senha"
                disabled={registerMutation.isPending}
                className="pl-9 pr-10"
                aria-invalid={!!errors.confirmPassword}
                {...formRegister("confirmPassword")}
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

          {/* Indicadores Visuais de Força de Senha */}
          <div className="p-3 rounded-lg bg-muted/40 space-y-1.5 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Requisitos de segurança:</p>
            <div className="grid grid-cols-2 gap-1.5">
              <span className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}`}>
                <Check className={`h-3.5 w-3.5 ${hasMinLength ? "opacity-100" : "opacity-30"}`} />
                Mínimo 8 caracteres
              </span>
              <span className={`flex items-center gap-1.5 ${hasUppercase && hasLowercase ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}`}>
                <Check className={`h-3.5 w-3.5 ${hasUppercase && hasLowercase ? "opacity-100" : "opacity-30"}`} />
                Maiúsculas e minúsculas
              </span>
              <span className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}`}>
                <Check className={`h-3.5 w-3.5 ${hasNumber ? "opacity-100" : "opacity-30"}`} />
                Pelo menos 1 número
              </span>
              <span className={`flex items-center gap-1.5 ${hasSpecialChar ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}`}>
                <Check className={`h-3.5 w-3.5 ${hasSpecialChar ? "opacity-100" : "opacity-30"}`} />
                Caractere especial (!@#$)
              </span>
              <span className={`flex items-center gap-1.5 col-span-2 ${passwordsMatch ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}`}>
                <Check className={`h-3.5 w-3.5 ${passwordsMatch ? "opacity-100" : "opacity-30"}`} />
                Senhas coincidem
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-2">
          <Button
            size="lg"
            type="submit"
            className="w-full font-semibold"
            disabled={registerMutation.isPending || !hasMinLength || !passwordsMatch || watchedName.trim().length < 2}
          >
            {registerMutation.isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Criando conta...
              </>
            ) : (
              "Finalizar e acessar o Cifra"
            )}
          </Button>
        </CardFooter>
      </form>
    </>
  );
}
