import { FormEvent, useEffect, useState } from 'react';
import { api } from '../services/api';
import { extractErrorMessage } from '../lib/errors';
import { maskCpfCnpj } from '../lib/masks';

interface CheckoutLink {
  id: string;
  slug: string;
  method: 'PIX' | 'CARD';
  amountCents: number;
  description: string | null;
  externalReference: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  expiresAt: string | null;
}

function formatCents(cents: number | string | undefined) {
  const value = Number(cents ?? 0) / 100;
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function paymentUrl(slug: string): string {
  return `${window.location.origin}/pay/${slug}`;
}

export default function CheckoutPage() {
  const [links, setLinks] = useState<CheckoutLink[]>([]);
  const [method, setMethod] = useState<'PIX' | 'CARD'>('PIX');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [payerDocument, setPayerDocument] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function loadLinks() {
    const { data } = await api.get('/checkout/links');
    setLinks(data);
  }

  useEffect(() => {
    loadLinks();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const amountCents = Math.round(Number(amount.replace(',', '.')) * 100);
      await api.post('/checkout/links', {
        method,
        amountCents,
        description: description || undefined,
        payerDocument: method === 'PIX' ? payerDocument : undefined,
      });
      setAmount('');
      setDescription('');
      setPayerDocument('');
      await loadLinks();
    } catch (err) {
      setError(extractErrorMessage(err, 'Não foi possível criar o link.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(link: CheckoutLink) {
    const url = paymentUrl(link.slug);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // clipboard pode não estar disponível (ex.: contexto não seguro) — o link já fica visível no input.
    }
    setCopiedId(link.id);
    setTimeout(() => setCopiedId((prev) => (prev === link.id ? null : prev)), 2000);
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Checkout</h2>

      <div className="card">
        <h2>Novo link de pagamento</h2>
        <form onSubmit={handleCreate}>
          <div className="grid-2">
            <div>
              <label>Método</label>
              <select value={method} onChange={(e) => setMethod(e.target.value as 'PIX' | 'CARD')}>
                <option value="PIX">Pix</option>
                <option value="CARD">Cartão</option>
              </select>
            </div>
            <div>
              <label>Valor (R$)</label>
              <input
                required
                inputMode="decimal"
                placeholder="150,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <label>Descrição</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
          {method === 'PIX' && (
            <>
              <label>CPF/CNPJ do pagador</label>
              <input
                required
                inputMode="numeric"
                placeholder="000.000.000-00"
                maxLength={18}
                value={payerDocument}
                onChange={(e) => setPayerDocument(maskCpfCnpj(e.target.value))}
              />
            </>
          )}
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            Criar link
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Links de checkout</h2>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: -8 }}>
          Compartilhe o link com o pagador — a cobrança (Pix ou cartão) acontece na página que ele
          abrir, não aqui.
        </p>
        {links.length === 0 && <p style={{ color: '#64748b' }}>Nenhum link criado ainda.</p>}
        {links.map((link) => (
          <div key={link.id} style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{formatCents(link.amountCents)}</strong> · {link.method}
                <div style={{ fontSize: 12, color: '#64748b' }}>{link.externalReference}</div>
                {link.status === 'ACTIVE' && link.expiresAt && (
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Expira em {new Date(link.expiresAt).toLocaleString('pt-BR')}
                  </div>
                )}
              </div>
              <span className={`badge ${link.status}`}>{link.status}</span>
            </div>

            {link.status === 'ACTIVE' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                <input readOnly value={paymentUrl(link.slug)} style={{ flex: 1, fontSize: 12 }} />
                <button type="button" onClick={() => handleCopy(link)}>
                  {copiedId === link.id ? 'Copiado!' : 'Copiar link'}
                </button>
                <a href={paymentUrl(link.slug)} target="_blank" rel="noreferrer">
                  <button type="button" className="secondary">
                    Abrir
                  </button>
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
