import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { RecoveryWizard } from "./recovery-wizard";
import { authService } from "../../services/auth.service";

vi.mock("../../services/auth.service", () => ({
  authService: {
    sendVerificationCode: vi.fn(),
    verifyCode: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

describe("RecoveryWizard Component - Testes de Integração do Fluxo de Recuperação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar inicialmente o Passo 1 com campo de e-mail e botão de envio", () => {
    renderWithProviders(<RecoveryWizard />);

    expect(screen.getByText(/recuperar senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^e-mail$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enviar código/i })).toBeInTheDocument();
  });

  it("deve avançar para o Passo 2 ao enviar o código de recuperação com sucesso", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.sendVerificationCode).mockResolvedValueOnce({
      message: "Código enviado",
    });

    renderWithProviders(<RecoveryWizard />);

    await user.type(screen.getByLabelText(/^e-mail$/i), "recuperar@cifra.app");
    await user.click(screen.getByRole("button", { name: /enviar código/i }));

    await waitFor(() => {
      expect(authService.sendVerificationCode).toHaveBeenCalledWith({
        email: "recuperar@cifra.app",
        purpose: "PASSWORD_RESET",
      });
      expect(screen.getByText(/verifique seu e-mail/i)).toBeInTheDocument();
      expect(screen.getByText(/recuperar@cifra\.app/i)).toBeInTheDocument();
    });
  });

  it("deve permitir retornar ao Passo 1 ao clicar em alterar e-mail no Passo 2", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.sendVerificationCode).mockResolvedValueOnce({
      message: "Código enviado",
    });

    renderWithProviders(<RecoveryWizard />);

    await user.type(screen.getByLabelText(/^e-mail$/i), "recuperar@cifra.app");
    await user.click(screen.getByRole("button", { name: /enviar código/i }));

    await waitFor(() => {
      expect(screen.getByText(/verifique seu e-mail/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /alterar e-mail informado/i }));

    expect(screen.getByText(/recuperar senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^e-mail$/i)).toHaveValue("recuperar@cifra.app");
  });

  it("deve executar o fluxo completo até o Passo 3 e submeter a nova senha com o verificationTicket", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.sendVerificationCode).mockResolvedValueOnce({
      message: "Código enviado",
    });
    vi.mocked(authService.verifyCode).mockResolvedValueOnce({
      verified: true,
      message: "Código válido",
      verificationTicket: "ticket-reset-12345",
    });
    vi.mocked(authService.resetPassword).mockResolvedValueOnce({
      message: "Senha alterada",
    });

    renderWithProviders(<RecoveryWizard />);

    // Passo 1: Enviar e-mail
    await user.type(screen.getByLabelText(/^e-mail$/i), "recuperar@cifra.app");
    await user.click(screen.getByRole("button", { name: /enviar código/i }));

    await waitFor(() => {
      expect(screen.getByText(/verifique seu e-mail/i)).toBeInTheDocument();
    });

    // Passo 2: Digitar código OTP
    const otpInput = screen.getByRole("textbox");
    await user.type(otpInput, "654321");
    await user.click(screen.getByRole("button", { name: /continuar/i }));

    // Passo 3: Criar nova senha
    await waitFor(() => {
      expect(screen.getByText(/criar nova senha/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/^nova senha$/i), "NovaSenha123!");
    await user.type(screen.getByLabelText(/confirmar nova senha/i), "NovaSenha123!");

    const submitButton = screen.getByRole("button", { name: /concluir redefinição/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith({
        email: "recuperar@cifra.app",
        password: "NovaSenha123!",
        verificationTicket: "ticket-reset-12345",
      });
    });
  });
});
