"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft } from "lucide-react";
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
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "../../schemas/auth.schema";
import { useSendVerificationCodeMutation } from "../../hooks/use-auth-mutations";

interface RecoveryEmailStepProps {
  initialEmail?: string;
  onSuccess: (email: string) => void;
}

export function RecoveryEmailStep({
  initialEmail = "",
  onSuccess,
}: RecoveryEmailStepProps) {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: initialEmail,
    },
  });

  const sendCodeMutation = useSendVerificationCodeMutation({
    onSuccess: (_, variables) => {
      toast.add({
        title: "Código enviado!",
        description: `Enviamos o código de recuperação para ${variables.email}`,
        type: "success",
      });
      onSuccess(variables.email);
    },
    onError: (error: Error) => {
      setErrorMessage(
        error.message || "Erro ao solicitar recuperação. Tente novamente."
      );
      toast.add({
        title: "Erro ao enviar código",
        description: error.message || "Não foi possível enviar o código.",
        type: "error",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    setErrorMessage(null);
    sendCodeMutation.mutate({
      email: data.email.trim().toLowerCase(),
      purpose: "PASSWORD_RESET",
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-bold tracking-tight">
          Recuperar Senha
        </CardTitle>
        <CardDescription className="text-sm mb-4">
          Informe seu e-mail cadastrado para receber o código de recuperação.
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
          <Label htmlFor="recovery-email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="recovery-email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              autoFocus
              disabled={sendCodeMutation.isPending}
              className="pl-9"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive font-medium">
              {errors.email.message}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 mt-4">
        <Button
          size="lg"
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          disabled={sendCodeMutation.isPending}
        >
          {sendCodeMutation.isPending ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Enviando código...
            </>
          ) : (
            "Enviar código"
          )}
        </Button>

        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para o login
        </Link>
      </CardFooter>
    </form>
  );
}
