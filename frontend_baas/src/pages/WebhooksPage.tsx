import { FormEvent, useState } from 'react';
import { api } from '../services/api';

export default function WebhooksPage() {
  const [publicBaseUrl, setPublicBaseUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const { data } = await api.post('/webhooks/register', {
        publicBaseUrl: publicBaseUrl || undefined,
      });
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Não foi possível cadastrar os webhooks.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Webhooks</h2>
      <div className="card">
        <h2>Cadastro no gateway</h2>
        <p style={{ color: '#64748b', fontSize: 13 }}>
          Cadastra no Lera Box as URLs de callback para PAYMENT_PIX, PAYMENT_CARD e WITHDRAWAL,
          apontando para este backend BaaS. Deixe em branco para usar PUBLIC_BASE_URL do .env do
          backend.
        </p>
        <form onSubmit={handleSubmit}>
          <label>URL pública do backend (opcional)</label>
          <input
            placeholder="https://meudominio.com"
            value={publicBaseUrl}
            onChange={(e) => setPublicBaseUrl(e.target.value)}
          />
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            Cadastrar webhooks
          </button>
        </form>

        {result && (
          <div style={{ marginTop: 16 }}>
            <div className="success-msg">{result.message}</div>
            <table>
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>URL</th>
                </tr>
              </thead>
              <tbody>
                {result.webhooks?.map((w: any) => (
                  <tr key={w.event}>
                    <td>{w.event}</td>
                    <td style={{ fontSize: 12 }}>{w.url}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
