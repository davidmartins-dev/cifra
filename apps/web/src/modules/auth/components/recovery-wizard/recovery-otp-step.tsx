"use client";

import * as React from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@repo/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@repo/ui/input-otp";
import { Label } from "@repo/ui/label";
import { Spinner } from "@repo/ui/spinner";
import { toast } from "@repo/ui/toast";
import { otpStepSchema, type OtpStepFormData } from "../../schemas/auth.schema";
import {
  useVerifyCodeMutation,
  useSendVerificationCodeMutation,
} from "../../hooks/use-auth-mutations";

interface RecoveryOtpStepProps {
  email: string;
  onSuccess: (verificationTicket: string) => void;
  onBack: () => void;
}

export function RecoveryOtpStep({
  email,
  onSuccess,
  onBack,
}: RecoveryOtpStepProps) {
  const [resendCooldown, setResendCooldown] = React.useState(60);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpStepFormData>({
    resolver: zodResolver(otpStepSchema),
    defaultValues: {
      code: "",
    },
  });

  const codeValue = useWatch({ control, name: "code" });

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const verifyMutation = useVerifyCodeMutation({
    onSuccess: (response) => {
      toast.add({
        title: "Código validado!",
        description: "Agora você pode definir sua nova senha de acesso.",
        type: "success",
      });
      onSuccess(response.verificationTicket);
    },
    onError: (error: Error) => {
      setErrorMessage(
        error.message || "Código inválido ou expirado. Tente novamente."
      );
      toast.add({
        title: "Falha na validação",
        description: error.message || "Código inválido ou expirado.",
        type: "error",
      });
    },
  });

  const resendMutation = useSendVerificationCodeMutation({
    onSuccess: () => {
      setResendCooldown(60);
      setErrorMessage(null);
      toast.add({
        title: "Código reenviado!",
        description: `Enviamos um novo código para ${email}`,
        type: "success",
      });
    },
    onError: (error: Error) => {
      toast.add({
        title: "Erro ao reenviar",
        description: error.message || "Aguarde um momento antes de reenviar.",
        type: "error",
      });
    },
  });

  const onVerify = (data: OtpStepFormData) => {
    setErrorMessage(null);
    verifyMutation.mutate({
      email,
      code: data.code,
      purpose: "PASSWORD_RESET",
    });
  };

  const handleResend = () => {
    if (resendCooldown > 0 || resendMutation.isPending) return;
    resendMutation.mutate({
      email,
      purpose: "PASSWORD_RESET",
    });
  };

  return (
    <form onSubmit={handleSubmit(onVerify)}>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-bold tracking-tight">
          Verifique seu e-mail
        </CardTitle>
        <CardDescription className="text-sm mb-4">
          Digite o código de 6 dígitos enviado para{" "}
          <strong className="text-foreground font-medium">{email}</strong>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2"
          >
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-3 flex flex-col items-center">
          <Label htmlFor="otp-input" className="text-xs text-muted-foreground">
            Código de segurança
          </Label>

          <Controller
            control={control}
            name="code"
            render={({ field }) => (
              <InputOTP
                id="otp-input"
                maxLength={6}
                value={field.value}
                onChange={field.onChange}
                disabled={verifyMutation.isPending}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            )}
          />

          {errors.code && (
            <p className="text-xs text-destructive font-medium">
              {errors.code.message}
            </p>
          )}
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendMutation.isPending}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {resendMutation.isPending ? (
              <>
                <Spinner className="h-3 w-3" />
                Reenviando...
              </>
            ) : resendCooldown > 0 ? (
              `Reenviar código em ${resendCooldown}s`
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                Não recebeu? Reenviar código
              </>
            )}
          </button>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 mt-4">
        <Button
          size="lg"
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          disabled={verifyMutation.isPending || codeValue?.length !== 6}
        >
          {verifyMutation.isPending ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Validando...
            </>
          ) : (
            "Continuar"
          )}
        </Button>

        <button
          type="button"
          onClick={onBack}
          disabled={verifyMutation.isPending}
          className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Alterar e-mail informado
        </button>
      </CardFooter>
    </form>
  );
}
