import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";
import { authService } from "../../services/auth.service";

vi.mock("../../services/auth.service", () => ({
  authService: {
    login: vi.fn(),
  },
}));

describe("LoginForm Component - Testes de Integração", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar os campos de email, senha, botão e links de navegação", () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByText(/acesse sua conta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^senha$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^entrar$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /esqueci minha senha/i })).toHaveAttribute(
      "href",
      "/forgot-password"
    );
    expect(screen.getByRole("link", { name: /criar conta/i })).toHaveAttribute(
      "href",
      "/register"
    );
  });

  it("deve alternar a visibilidade da senha ao clicar no botão do olho", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const passwordInput = screen.getByLabelText(/^senha$/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = screen.getByRole("button", { name: /ver senha/i });
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");

    const hideButton = screen.getByRole("button", { name: /ocultar senha/i });
    await user.click(hideButton);

    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("deve exibir validação do Zod ao submeter com campos vazios", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: /^entrar$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/informe seu e-mail/i)).toBeInTheDocument();
      expect(screen.getByText(/informe sua senha/i)).toBeInTheDocument();
    });

    expect(authService.login).not.toHaveBeenCalled();
  });

  it("deve disparar mutation com credenciais e exibir loading", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                message: "OK",
                user: {
                  id: "1",
                  name: "David",
                  email: "david@cifra.app",
                  role: "USER",
                  createdAt: new Date().toISOString(),
                },
              }),
            50
          )
        )
    );

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText(/e-mail/i), "david@cifra.app");
    await user.type(screen.getByLabelText(/^senha$/i), "Password123!");

    const submitButton = screen.getByRole("button", { name: /^entrar$/i });
    await user.click(submitButton);

    expect(screen.getByText(/entrando\.\.\./i)).toBeInTheDocument();

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: "david@cifra.app",
        password: "Password123!",
      });
    });
  });

  it("deve exibir mensagem de erro visual quando a autenticação falhar", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockRejectedValueOnce(
      new Error("Credenciais inválidas. Verifique seu e-mail e senha.")
    );

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText(/e-mail/i), "david@cifra.app");
    await user.type(screen.getByLabelText(/^senha$/i), "WrongPassword123!");

    const submitButton = screen.getByRole("button", { name: /^entrar$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/credenciais inválidas\. verifique seu e-mail e senha\./i)
      ).toBeInTheDocument();
    });
  });
});
