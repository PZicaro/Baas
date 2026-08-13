import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { extractErrorMessage } from '../lib/errors';
import { statusLabel } from '../lib/statusLabels';

interface WalletTransaction {
  id?: string;
  createdAt?: string;
  type?: string;
  externalReference?: string;
  reference?: string;
  amount?: number;
  amountCents?: number;
  status?: string;
}

function formatCents(cents: number | string | null | undefined) {
  const value = Number(cents ?? 0) / 100;
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const STATUS_FILTERS = [
  { label: 'Todos', value: '' },
  { label: 'Sucesso', value: 'APPROVED' },
  { label: 'Falha', value: 'DENIED' },
  { label: 'Expirado', value: 'EXPIRED' },
  { label: 'Cancelado', value: 'CANCELLED' },
];

// O extrato do gateway (GET /wallet/transactions) não segue exatamente o
// TransactionType do backend — na prática já vimos "credit_card" em vez de
// "CARD", por exemplo. Mapeia as variantes conhecidas; normalize() cobre
// maiúscula/minúscula e "-"/"_" antes de bater com a chave.
const TYPE_LABELS: Record<string, string> = {
  PIX: 'Pix',
  CARD: 'Cartão',
  CREDIT_CARD: 'Cartão',
  DEBIT_CARD: 'Cartão de débito',
  WITHDRAWAL: 'Saque',
  FEE: 'Tarifa',
  OTHER: 'Outro',
};

function normalizeTypeKey(type: string): string {
  return type.toUpperCase().replace(/[\s-]+/g, '_');
}

function typeLabel(type: string | undefined): string {
  if (!type) return '-';
  return TYPE_LABELS[normalizeTypeKey(type)] ?? type;
}

export default function DashboardPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadWallet() {
    try {
      const { data } = await api.get('/wallet');
      setBalance(data.balance ?? data.balanceCents ?? data.amount ?? 0);
    } catch {
      setBalance(null);
    }
  }

  async function loadTransactions() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/wallet/transactions', {
        params: { status: status || undefined, type: type || undefined, limit: 50 },
      });
      setTransactions(Array.isArray(data) ? data : (data?.data ?? data?.transactions ?? []));
    } catch (err) {
      setError(
        extractErrorMessage(err, 'Não foi possível carregar o extrato. Conecte-se ao gateway primeiro.'),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWallet();
  }, []);

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, type]);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Carteira</h2>

      <div className="card">
        <label style={{ marginTop: 0 }}>Saldo disponível</label>
        <div className="balance">{formatCents(balance)}</div>
      </div>

      <div className="card">
        <h2>Extrato</h2>
        <div className="filters">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="PIX">Pix</option>
            <option value="CARD">Cartão</option>
            <option value="WITHDRAWAL">Saque</option>
          </select>
        </div>

        {loading && <p>Carregando...</p>}
        {error && <div className="error">{error}</div>}

        {!loading && !error && (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Referência</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: '#64748b' }}>
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              )}
              {transactions.map((tx, i) => (
                <tr key={tx.id ?? i}>
                  <td>{tx.createdAt ? new Date(tx.createdAt).toLocaleString('pt-BR') : '-'}</td>
                  <td>{typeLabel(tx.type)}</td>
                  <td>{tx.externalReference ?? tx.reference ?? '-'}</td>
                  <td>{formatCents(tx.amount ?? tx.amountCents)}</td>
                  <td>
                    <span className={`badge ${tx.status ?? ''}`}>{statusLabel(tx.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
