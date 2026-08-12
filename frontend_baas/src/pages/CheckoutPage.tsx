import { FormEvent, useEffect, useState } from 'react';
import { api } from '../services/api';

function formatCents(cents: number | string | undefined) {
  const value = Number(cents ?? 0) / 100;
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CheckoutPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [method, setMethod] = useState<'PIX' | 'CARD'>('PIX');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [fees, setFees] = useState<any[]>([]);
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);
  const [installments, setInstallments] = useState(1);
  const [brand, setBrand] = useState('VISA');
  const [pixResult, setPixResult] = useState<Record<string, any>>({});

  async function loadLinks() {
    const { data } = await api.get('/checkout/links');
    setLinks(data);
  }

  async function loadFees() {
    try {
      const { data } = await api.get('/fees');
      setFees(Array.isArray(data) ? data : data?.data ?? data?.fees ?? []);
    } catch {
      setFees([]);
    }
  }

  useEffect(() => {
    loadLinks();
    loadFees();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const amountCents = Math.round(Number(amount.replace(',', '.')) * 100);
      await api.post('/checkout/links', { method, amountCents, description });
      setAmount('');
      setDescription('');
      await loadLinks();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Não foi possível criar o link.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePix(linkId: string) {
    setError(null);
    try {
      const { data } = await api.post(`/checkout/links/${linkId}/pix`);
      setPixResult((prev) => ({ ...prev, [linkId]: data }));
      await loadLinks();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Falha ao gerar cobrança Pix.');
    }
  }

  async function handlePayCard(linkId: string) {
    setError(null);
    try {
      await api.post(`/checkout/links/${linkId}/card`, { installments, brand });
      setActiveLinkId(null);
      await loadLinks();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Falha ao processar cobrança de cartão.');
    }
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
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            Criar link
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Links de checkout</h2>
        {links.length === 0 && <p style={{ color: '#64748b' }}>Nenhum link criado ainda.</p>}
        {links.map((link) => (
          <div key={link.id} style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{formatCents(link.amountCents)}</strong> · {link.method}
                <div style={{ fontSize: 12, color: '#64748b' }}>{link.externalReference}</div>
              </div>
              <span className={`badge ${link.status}`}>{link.status}</span>
            </div>

            {link.method === 'PIX' && link.status === 'CREATED' && (
              <button onClick={() => handleGeneratePix(link.id)}>Gerar cobrança Pix</button>
            )}

            {link.method === 'CARD' && link.status === 'CREATED' && (
              <div>
                <button onClick={() => setActiveLinkId(activeLinkId === link.id ? null : link.id)}>
                  {activeLinkId === link.id ? 'Cancelar' : 'Pagar com cartão'}
                </button>
                {activeLinkId === link.id && (
                  <div className="grid-2" style={{ marginTop: 8 }}>
                    <div>
                      <label>Parcelas</label>
                      <select value={installments} onChange={(e) => setInstallments(Number(e.target.value))}>
                        {Array.from({ length: 21 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}x
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>Bandeira</label>
                      <select value={brand} onChange={(e) => setBrand(e.target.value)}>
                        <option value="VISA">Visa</option>
                        <option value="MASTER">Master</option>
                        <option value="ELO">Elo</option>
                      </select>
                    </div>
                    <button onClick={() => handlePayCard(link.id)}>Confirmar cobrança</button>
                  </div>
                )}
              </div>
            )}

            {pixResult[link.id]?.qrCodeBase64 && (
              <div className="qr-box">
                <img
                  src={`data:image/png;base64,${pixResult[link.id].qrCodeBase64}`}
                  alt="QR Code Pix"
                />
                <p style={{ fontSize: 12, wordBreak: 'break-all' }}>{pixResult[link.id].emv}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {fees.length > 0 && (
        <div className="card">
          <h2>Taxas de cartão (GET /fees)</h2>
          <table>
            <thead>
              <tr>
                <th>Parcelas</th>
                <th>Bandeira</th>
                <th>Taxa</th>
              </tr>
            </thead>
            <tbody>
              {fees.slice(0, 10).map((f, i) => (
                <tr key={i}>
                  <td>{f.installments ?? f.parcelas}x</td>
                  <td>{f.brand ?? f.bandeira ?? '-'}</td>
                  <td>{f.feePercent ?? f.fee ?? f.taxa}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
