import { FormEvent, useEffect, useState } from "react";
import { api } from "../services/api";
import { extractErrorMessage } from "../lib/errors";
import { maskCpfCnpj } from "../lib/masks";
import type { GatewayStatus } from "../hooks/useGatewayStatus";

interface GatewayConnectModalProps {
  open: boolean;
  onClose: () => void;
  onConnected: () => void;
  status: GatewayStatus | null;
}

type Mode = "register" | "login" | "reset";

const initialRegisterState = {
  personType: "PJ" as "PF" | "PJ",
  name: "",
  tradingName: "",
  email: "",
  phone: "",
  document: "",
  zipCode: "",
  address: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

/**
 * Popup para cadastrar/logar a loja no gateway Lera Box. Substitui a antiga
 * página escondida em /gateway: aparece automaticamente logo após o login
 * na conta do BaaS (enquanto a loja não estiver conectada) e pode ser
 * reaberto a qualquer momento pelo botão na barra lateral.
 *
 * Os campos do cadastro espelham exatamente o CreateUserDto de
 * POST /api/users do gateway (ver https://api.branchpay.com.br/docs).
 */
export default function GatewayConnectModal({
  open,
  onClose,
  onConnected,
  status,
}: GatewayConnectModalProps) {
  const [mode, setMode] = useState<Mode>("register");
  const [form, setForm] = useState(initialRegisterState);

  const [loginDocument, setLoginDocument] = useState("");
  const [password, setPassword] = useState("");

  const [resetDocument, setResetDocument] = useState("");
  const [resetEmail, setResetEmail] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Se a loja já está conectada, o popup abre num aviso em vez do
  // formulário — só mostra as abas de novo se o usuário pedir
  // explicitamente pra trocar de conta.
  const [forceShowForms, setForceShowForms] = useState(false);
  const alreadyConnected = Boolean(status?.connected) && !forceShowForms;

  // Reseta o feedback ao trocar de aba ou reabrir o popup.
  useEffect(() => {
    if (open) {
      setMessage(null);
      setError(null);
    }
  }, [open, mode]);

  // Volta a mostrar o aviso de "já conectado" (em vez do formulário) toda
  // vez que o popup é reaberto — não fica preso no modo "trocar de conta"
  // de uma visita anterior.
  useEffect(() => {
    if (open) setForceShowForms(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function setField<K extends keyof typeof initialRegisterState>(
    key: K,
    value: string,
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const { data } = await api.post("/gateway/register", form);
      setMessage(data.message);
      setLoginDocument(form.document);
      setMode("login");
    } catch (err) {
      setError(extractErrorMessage(err, "Falha ao cadastrar no gateway."));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      await api.post("/gateway/login", {
        document: loginDocument,
        password,
        email: form.email || undefined,
        phone: form.phone || undefined,
      });
      onConnected();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, "Falha ao autenticar no gateway."));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const { data } = await api.post("/gateway/reset-password", {
        document: resetDocument,
        email: resetEmail,
      });
      setMessage(data.message);
      setLoginDocument(resetDocument);
    } catch (err) {
      setError(
        extractErrorMessage(err, "Falha ao solicitar redefinição de senha."),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gateway-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="gateway-modal-title">
            {alreadyConnected
              ? "Conta no gateway"
              : "Conecte sua loja ao gateway"}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {alreadyConnected ? (
          <div>
            <div className="success-msg" role="status">
              Sua loja já está conectada ao gateway Lera Box.
              {status?.codigoCliente && (
                <>
                  <br />
                  CodigoCliente: {status.codigoCliente}
                </>
              )}
              {status?.gatewayEmail && (
                <>
                  <br />
                  E-mail: {status.gatewayEmail}
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button type="button" onClick={onClose}>
                Fechar
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setForceShowForms(true);
                  setMode("login");
                }}
              >
                Conectar outra conta
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="modal-subtitle">
              Sem essa conexão a loja não consegue processar Pix, cartão ou
              saques pelo Lera Box.
            </p>

            {mode !== "reset" && (
              <div
                className="auth-tabs"
                role="tablist"
                aria-label="Modo de conexão com o gateway"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "register"}
                  className={mode === "register" ? "active" : ""}
                  onClick={() => setMode("register")}
                >
                  Cadastrar loja
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "login"}
                  className={mode === "login" ? "active" : ""}
                  onClick={() => setMode("login")}
                >
                  Já tenho conta
                </button>
              </div>
            )}

            {mode === "register" ? (
              <form onSubmit={handleRegister}>
                <p className="modal-hint">
                  Use e-mail e telefone reais: o gateway envia documento, senha,
                  CodigoCliente e ChaveLoja por e-mail.
                </p>
                <div className="grid-2">
                  <div>
                    <label>Tipo</label>
                    <select
                      value={form.personType}
                      onChange={(e) => setField("personType", e.target.value)}
                    >
                      <option value="PJ">Pessoa Jurídica</option>
                      <option value="PF">Pessoa Física</option>
                    </select>
                  </div>
                  <div>
                    <label>CPF/CNPJ</label>
                    <input
                      required
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      maxLength={18}
                      value={form.document}
                      onChange={(e) =>
                        setField("document", maskCpfCnpj(e.target.value))
                      }
                    />
                  </div>
                </div>

                <label>
                  {form.personType === "PJ" ? "Razão social" : "Nome completo"}
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                />

                {form.personType === "PJ" && (
                  <>
                    <label>Nome fantasia</label>
                    <input
                      value={form.tradingName}
                      onChange={(e) => setField("tradingName", e.target.value)}
                    />
                  </>
                )}

                <div className="grid-2">
                  <div>
                    <label>E-mail (real)</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Telefone (real)</label>
                    <input
                      required
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div>
                    <label>CEP</label>
                    <input
                      required
                      value={form.zipCode}
                      onChange={(e) => setField("zipCode", e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Número</label>
                    <input
                      required
                      value={form.number}
                      onChange={(e) => setField("number", e.target.value)}
                    />
                  </div>
                </div>

                <label>Endereço</label>
                <input
                  required
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                />

                <div className="grid-2">
                  <div>
                    <label>Complemento</label>
                    <input
                      value={form.complement}
                      onChange={(e) => setField("complement", e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Bairro</label>
                    <input
                      required
                      value={form.neighborhood}
                      onChange={(e) => setField("neighborhood", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div>
                    <label>Cidade</label>
                    <input
                      required
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Estado (UF)</label>
                    <input
                      required
                      maxLength={2}
                      value={form.state}
                      onChange={(e) =>
                        setField("state", e.target.value.toUpperCase())
                      }
                    />
                  </div>
                </div>

                {error && <div className="error">{error}</div>}
                {message && <div className="success-msg">{message}</div>}

                <button type="submit" disabled={loading}>
                  {loading ? "Enviando..." : "Cadastrar no gateway"}
                </button>
              </form>
            ) : mode === "login" ? (
              <form onSubmit={handleLogin}>
                <p className="modal-hint">
                  Informe a senha recebida por e-mail para conectar a loja.
                </p>
                <label>CPF/CNPJ</label>
                <input
                  required
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  maxLength={18}
                  value={loginDocument}
                  onChange={(e) =>
                    setLoginDocument(maskCpfCnpj(e.target.value))
                  }
                />
                <label>Senha (recebida por e-mail)</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {error && <div className="error">{error}</div>}
                {message && <div className="success-msg">{message}</div>}

                <button type="submit" disabled={loading}>
                  {loading ? "Conectando..." : "Conectar loja"}
                </button>
                <button
                  type="button"
                  className="secondary modal-later"
                  onClick={() => {
                    setResetDocument(loginDocument);
                    setMode("reset");
                  }}
                >
                  Esqueci minha senha
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <p className="modal-hint">
                  Informe o CPF/CNPJ e o e-mail cadastrados no gateway — uma
                  nova senha é enviada por e-mail.
                </p>
                <label>CPF/CNPJ</label>
                <input
                  required
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  maxLength={18}
                  value={resetDocument}
                  onChange={(e) =>
                    setResetDocument(maskCpfCnpj(e.target.value))
                  }
                />
                <label>E-mail cadastrado no gateway</label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />

                {error && <div className="error">{error}</div>}
                {message && <div className="success-msg">{message}</div>}

                <button type="submit" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar nova senha"}
                </button>
                <button
                  type="button"
                  className="secondary modal-later"
                  onClick={() => setMode("login")}
                >
                  ← Voltar para login
                </button>
              </form>
            )}

            <button
              type="button"
              className="secondary modal-later"
              onClick={onClose}
            >
              Fazer isso depois
            </button>
          </>
        )}
      </div>
    </div>
  );
}
