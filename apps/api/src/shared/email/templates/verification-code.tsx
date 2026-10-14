import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import * as React from 'react';

export interface VerificationCodeEmailProps {
  code: string;
  actionText?: string;
  expiresInMinutes?: number;
}

export function VerificationCodeEmail({
  code,
  actionText = 'confirmar sua identidade no Cifra',
  expiresInMinutes = 10,
}: VerificationCodeEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Seu código de verificação do Cifra: {code}</Preview>
      <Tailwind>
        <Body className="font-sans my-auto mx-auto px-0 py-4 text-gray-600">
          <Container className="bg-white px-4 py-8 border border-solid border-gray-200 rounded-xl max-w-[500px] mx-auto shadow-sm">
            {/* Header / Brand */} 
            <Section className="border-b border-solid border-gray-400 pb-4">
              <Text className="text-2xl font-extrabold text-black tracking-tight m-0"> 
                Cifra<span className="text-emerald-500">.</span>
              </Text> 
            </Section> 

            {/* Content */}
            <Heading className="text-xl mt-4 font-bold text-gray-800">
              Código de verificação
            </Heading>
            <Text className="text-[15px] leading-6 text-gray-500">
              Use o código de segurança abaixo para {actionText}.
            </Text>

            {/* OTP Box */}
            <Section className="bg-[#f8fafc] border border-dashed border-[#cbd5e1] rounded-lg py-5 px-4 text-center mb-6">
              <Text className="font-mono text-3xl font-extrabold tracking-[8px] text-gray-600 m-0">
                {code}
              </Text>
            </Section>

            <Text className="text-xs text-gray-500 mb-1">
              Este código expira em <strong>{expiresInMinutes} minutos</strong>.
            </Text>
            <Text className="text-xs text-gray-500 mb-6">
              Por segurança, nunca compartilhe este código com outras pessoas.
            </Text>

            {/* Notice Callout */}
            <Section className="bg-gray-50 rounded-md p-3 mb-6">
              <Text className="text-[11px] text-gray-500 leading-4 m-0">
                Se você não solicitou este código, ignore esta mensagem com segurança. Nenhuma ação será realizada na sua conta.
              </Text>
            </Section>

            {/* Footer */}
            <Section className="border-t border-solid border-gray-400 pt-4 text-center">
              <Text className="text-xs text-gray-500 m-0 mb-1">
                Cifra &bull; Gestão Financeira Pessoal
              </Text>
              <Text className="text-[11px] text-gray-500 m-0">
                Este é um e-mail automático. Por favor, não responda.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default VerificationCodeEmail;
