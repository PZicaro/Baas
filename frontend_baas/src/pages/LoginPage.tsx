import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconStore() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />
      <path d="M2 9h20l-1.6-5.4A1 1 0 0 0 19.5 3h-15a1 1 0 0 0-.9.6L2 9Z" />
      <path d="M12 22V13" />
    </svg>
  );
}

function IconEye({ off }: { off?: boolean }) {
  return off ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61C3.06 8.9 1 12 1 12s3 8 11 8a9.26 9.26 0 0 0 5.39-1.61" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const FEATURES = [
  'Saldo e repasses em tempo real',
  'Cobranças Pix e cartão no mesmo painel',
  'Conciliação automática com o gateway',
];

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: 'login' | 'register') {
    if (next === mode) return;
    setMode(next);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim() || undefined);
      }
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Não foi possível autenticar. Verifique seus dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <div className="auth-brand-glow" aria-hidden="true" />
        <div className="auth-brand-content">
          <span className="auth-brand-badge">VBA Systems</span>
          <h1>Painel BaaS para o seu negócio</h1>
          <p>
            Acompanhe saldo, cobranças e repasses da sua loja em um só lugar, com dados
            sincronizados direto do gateway Lera Box.
          </p>
          <ul className="auth-feature-list">
            {FEATURES.map((feature) => (
              <li key={feature}>
                <span className="auth-feature-check">
                  <IconCheck />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h2>{mode === 'login' ? 'Bem-vindo de volta' : 'Criar sua conta'}</h2>
            <p>
              {mode === 'login'
                ? 'Entre com as credenciais da sua loja para acessar o painel.'
                : 'Leva menos de um minuto para começar.'}
            </p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Modo de acesso">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={mode === 'login' ? 'active' : ''}
              onClick={() => switchMode('login')}
            >
              Entrar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={mode === 'register' ? 'active' : ''}
              onClick={() => switchMode('register')}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {mode === 'register' && (
              <div className="field-group">
                <label htmlFor="name">Nome da loja</label>
                <div className="input-group">
                  <span className="input-icon">
                    <IconStore />
                  </span>
                  <input
                    id="name"
                    type="text"
                    autoComplete="organization"
                    placeholder="Ex.: Loja da Ana"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="field-group">
              <label htmlFor="email">E-mail</label>
              <div className="input-group">
                <span className="input-icon">
                  <IconMail />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  placeholder="voce@loja.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="password">Senha</label>
              <div className="input-group">
                <span className="input-icon">
                  <IconLock />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="input-icon-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                >
                  <IconEye off={showPassword} />
                </button>
              </div>
              {mode === 'register' && <span className="field-hint">Mínimo de 8 caracteres.</span>}
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <IconAlert />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading && <span className="btn-spinner" aria-hidden="true" />}
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <p className="auth-footnote">
            O cadastro/login no gateway Lera Box é feito depois, já dentro do painel.
          </p>
        </div>
      </div>
    </div>
  );
}
