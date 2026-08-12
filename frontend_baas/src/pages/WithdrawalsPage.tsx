import { FormEvent, useEffect, useState } from 'react';
import { api } from '../services/api';

function formatCents(cents: number | string | undefined) {
  const value = Number(cents ?? 0) / 100;
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data } = await api.get('/withdrawals');
    setWithdrawals(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const amountCents = Math.round(Number(amount.replace(',', '.')) * 100);
      await api.post('/withdrawals', { amountCents, pixKey });
      setAmount('');
      setPixKey('');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Não foi possível solicitar o saque.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Saques</h2>

      <div className="card">
        <h2>Solicitar saque</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div>
              <label>Valor (R$)</label>
              <input
                required
                inputMode="decimal"
                placeholder="100,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label>Chave Pix de destino</label>
              <input required value={pixKey} onChange={(e) => setPixKey(e.target.value)} />
            </div>
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            Solicitar saque
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Histórico</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Valor</th>
              <th>Destino</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 && (
              <tr>
                <td colSpan={4} style={{ color: '#64748b' }}>
                  Nenhum saque solicitado ainda.
                </td>
              </tr>
            )}
            {withdrawals.map((w) => (
              <tr key={w.id}>
                <td>{new Date(w.createdAt).toLocaleString('pt-BR')}</td>
                <td>{formatCents(w.amountCents)}</td>
                <td>{w.pixKey ?? w.destinationAccount ?? '-'}</td>
                <td>
                  <span className={`badge ${w.status}`}>{w.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
