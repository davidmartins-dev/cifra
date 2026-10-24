import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { RegisterWizard } from "./register-wizard";
import { authService } from "../../services/auth.service";

vi.mock("../../services/auth.service", () => ({
  authService: {
    sendVerificationCode: vi.fn(),
    verifyCode: vi.fn(),
    register: vi.fn(),
  },
}));

describe("RegisterWizard Component - Testes de Integração do Fluxo de Cadastro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve iniciar no Passo 1 (E-mail) exibindo o formulário de envio de código", () => {
    renderWithProviders(<RegisterWizard />);

    expect(screen.getByText(/crie sua conta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continuar/i })).toBeInTheDocument();
  });

  it("deve avançar do Passo 1 para o Passo 2 ao enviar o código com sucesso", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.sendVerificationCode).mockResolvedValueOnce({
      message: "Código enviado",
    });

    renderWithProviders(<RegisterWizard />);

    await user.type(screen.getByLabelText(/e-mail/i), "novo@cifra.app");
    await user.click(screen.getByRole("button", { name: /continuar/i }));

    await waitFor(() => {
      expect(authService.sendVerificationCode).toHaveBeenCalledWith({
        email: "novo@cifra.app",
        purpose: "SIGNUP",
      });
      expect(screen.getByText(/verifique seu e-mail/i)).toBeInTheDocument();
      expect(screen.getByText(/novo@cifra\.app/i)).toBeInTheDocument();
    });
  });

  it("deve permitir retornar do Passo 2 para o Passo 1 ao clicar em alterar e-mail", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.sendVerificationCode).mockResolvedValueOnce({
      message: "Código enviado",
    });

    renderWithProviders(<RegisterWizard />);

    await user.type(screen.getByLabelText(/e-mail/i), "novo@cifra.app");
    await user.click(screen.getByRole("button", { name: /continuar/i }));

    await waitFor(() => {
      expect(screen.getByText(/verifique seu e-mail/i)).toBeInTheDocument();
    });

    const backButton = screen.getByRole("button", { name: /alterar e-mail informado/i });
    await user.click(backButton);

    expect(screen.getByText(/crie sua conta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toHaveValue("novo@cifra.app");
  });

  it("deve avançar para o Passo 3 após validação do código e checar os indicadores de força da senha", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.sendVerificationCode).mockResolvedValueOnce({
      message: "Código enviado",
    });
    vi.mocked(authService.verifyCode).mockResolvedValueOnce({
      verified: true,
      message: "Código verificado",
      verificationTicket: "valid-ticket-uuid",
    });

    renderWithProviders(<RegisterWizard />);

    // Passo 1 -> Passo 2
    await user.type(screen.getByLabelText(/e-mail/i), "novo@cifra.app");
    await user.click(screen.getByRole("button", { name: /continuar/i }));

    await waitFor(() => {
      expect(screen.getByText(/verifique seu e-mail/i)).toBeInTheDocument();
    });

    // Passo 2: Digitar OTP
    const otpInput = screen.getByRole("textbox");
    await user.type(otpInput, "123456");

    const continueButton = screen.getByRole("button", { name: /continuar/i });
    await user.click(continueButton);

    // Passo 3: Perfil e Senha
    await waitFor(() => {
      expect(screen.getByText(/configure seu perfil/i)).toBeInTheDocument();
    });

    // Testar indicadores de senha em tempo real
    const passwordInput = screen.getByLabelText(/^senha$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);

    expect(screen.getByText(/mínimo 8 caracteres/i)).toBeInTheDocument();
    expect(screen.getByText(/maiúsculas e minúsculas/i)).toBeInTheDocument();
    expect(screen.getByText(/pelo menos 1 número/i)).toBeInTheDocument();
    expect(screen.getByText(/caractere especial/i)).toBeInTheDocument();

    await user.type(passwordInput, "SenhaForte123!");
    await user.type(confirmPasswordInput, "SenhaForte123!");

    expect(screen.getByText(/senhas coincidem/i)).toBeInTheDocument();
  });
});
