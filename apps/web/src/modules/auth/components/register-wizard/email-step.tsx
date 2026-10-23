"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
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
import { emailStepSchema, type EmailStepFormData } from "../../schemas/auth.schema";
import { useSendVerificationCodeMutation } from "../../hooks/use-auth-mutations";

interface EmailStepProps {
  initialEmail?: string;
  onSuccess: (email: string) => void;
}

export function EmailStep({ initialEmail = "", onSuccess }: EmailStepProps) {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailStepFormData>({
    resolver: zodResolver(emailStepSchema),
    defaultValues: {
      email: initialEmail,
    },
  });

  const sendCodeMutation = useSendVerificationCodeMutation({
    onSuccess: (_, variables) => {
      toast.add({
        title: "Código enviado!",
        description: `Enviamos um código de 6 dígitos para ${variables.email}`,
        type: "success",
      });
      onSuccess(variables.email);
    },
    onError: (error: Error) => {
      const message =
        error.message || "Erro ao enviar código de verificação. Tente novamente.";
      setErrorMessage(message);
      toast.add({
        title: "Erro no envio",
        description: message,
        type: "error",
      });
    },
  });

  const onSubmit = (data: EmailStepFormData) => {
    setErrorMessage(null);
    sendCodeMutation.mutate({
      email: data.email.trim().toLowerCase(),
      purpose: "SIGNUP",
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-bold tracking-tight">
          Crie sua conta
        </CardTitle>
        <CardDescription className="text-sm mb-4">
          Informe o seu e-mail para criar a sua conta
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
          <Label htmlFor="signup-email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="signup-email"
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
            "Continuar"
          )}
        </Button>

        <div className="text-center text-xs text-muted-foreground">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
          >
            Entrar
          </Link>
        </div>
      </CardFooter>
    </form>
  );
}
