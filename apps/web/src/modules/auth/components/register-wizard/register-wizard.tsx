"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Logo } from "@repo/ui/logo";
import { Card } from "@repo/ui/card";
import { EmailStep } from "./email-step";
import { OtpStep } from "./otp-step";
import { PasswordStep } from "./password-step";

export function RegisterWizard() {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [email, setEmail] = React.useState("");
  const [verificationTicket, setVerificationTicket] = React.useState("");

  const stepsConfig = [
    { number: 1, label: "E-mail" },
    { number: 2, label: "Verificação" },
    { number: 3, label: "Finalização" },
  ];

  return (
    <div className="space-y-6">
      {/* Logo Centralizado */}
      <div className="flex justify-center">
        <Logo size="lg" />
      </div>

      {/* Indicador de Passos do Wizard */}
      <div className="flex items-start justify-center gap-1 sm:gap-2 px-2">
        {stepsConfig.map((s, idx) => {
          const isCompleted = step > s.number;
          const isCurrent = step === s.number;

          return (
            <React.Fragment key={s.number}>
              <div className="flex flex-col items-center gap-1.5 flex-1 max-w-21 sm:max-w-25 text-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all shrink-0 ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-primary text-primary-foreground ring-2 ring-emerald-500/30"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : s.number}
                </div>
                <span
                  className={`text-[11px] sm:text-xs font-medium transition-colors leading-tight ${
                    isCurrent || isCompleted
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>

              {idx < stepsConfig.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mt-3.5 -translate-y-1/2 min-w-4 max-w-10 sm:max-w-16 rounded transition-colors ${
                    step > s.number ? "bg-emerald-500" : "bg-muted"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Card do Formulário */}
      <Card className="border-border/60 shadow-xl backdrop-blur-sm bg-card/95">
        {step === 1 && (
          <EmailStep
            initialEmail={email}
            onSuccess={(verifiedEmail) => {
              setEmail(verifiedEmail);
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <OtpStep
            email={email}
            onBack={() => setStep(1)}
            onSuccess={(ticket) => {
              setVerificationTicket(ticket);
              setStep(3);
            }}
          />
        )}

        {step === 3 && (
          <PasswordStep
            email={email}
            verificationTicket={verificationTicket}
          />
        )}
      </Card>
    </div>
  );
}
