import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { extractErrorMessage } from '../lib/errors';

interface CheckoutLinkPublic {
  id: string;
  slug: string;
  method: 'PIX' | 'CARD';
  amountCents: number;
  description: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED';
  expiresAt: string | null;
}

interface GatewayFee {
  brand?: string;
  bandeira?: string;
  installments?: number;
  parcelas?: number;
  feePercent?: number;
  fee?: number;
  taxa?: number;
}

interface OrderResult {
  id?: string;
  status?: string;
  qrCodeBase64?: string;
  emv?: string;
}

function formatCents(cents: number | string | undefined) {
  const value = Number(cents ?? 0) / 100;
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function toDataUri(base64?: string): string {
  if (!base64) return '';
  return base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
}

function findFee(fees: GatewayFee[], brand: string, installments: number): number | null {
  const match = fees.find((f) => {
    const feeInstallments = f.installments ?? f.parcelas;
    const feeBrand = (f.brand ?? f.bandeira ?? '').toString().toUpperCase();
    return Number(feeInstallments) === installments && feeBrand === brand.toUpperCase();
  });
  const value = match?.feePercent ?? match?.fee ?? match?.taxa;
  return value === undefined || value === null ? null : Number(value);
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Aguardando pagamento',
  EXPIRED: 'Este link expirou',
  CANCELLED: 'Este link foi cancelado',
  COMPLETED: 'Cobrança já gerada para este link',
};

export default function PublicPaymentPage() {
  const { slug } = useParams<{ slug: string }>();
  const [link, setLink] = useState<CheckoutLinkPublic | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const [fees, setFees] = useState<GatewayFee[]>([]);
  const [installments, setInstallments] = useState(1);
  const [brand, setBrand] = useState('VISA');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    if (!slug) return;
    api
      .get(`/checkout/pay/${slug}`)
      .then(({ data }) => setLink(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (link?.method !== 'CARD') return;
    api
      .get('/fees')
      .then(({ data }) => setFees(Array.isArray(data) ? data : []))
      .catch(() => setFees([]));
  }, [link?.method]);

  async function handleGeneratePix() {
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await api.post(`/checkout/pay/${slug}/pix`);
      setOrder(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao gerar a cobrança Pix.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePayCard(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await api.post(`/checkout/pay/${slug}/card`, {
        installments,
        brand,
        cardNumber,
        cardHolder,
        expiryMonth,
        expiryYear,
        cvv,
      });
      setOrder(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao processar o pagamento.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckStatus() {
    setError(null);
    setCheckingStatus(true);
    try {
      const { data } = await api.get(`/checkout/pay/${slug}/status`);
      setOrder(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao consultar o status do pagamento.'));
    } finally {
      setCheckingStatus(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f1f5f9',
        padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div className="card">
          <h2 style={{ marginTop: 0, textAlign: 'center' }}>VBA Systems</h2>

          {loading && <p style={{ textAlign: 'center', color: '#64748b' }}>Carregando...</p>}

          {!loading && notFound && (
            <p style={{ textAlign: 'center', color: 'var(--danger)' }}>
              Link de pagamento não encontrado.
            </p>
          )}

          {!loading && link && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 32, fontWeight: 700 }}>{formatCents(link.amountCents)}</div>
                {link.description && (
                  <div style={{ color: '#64748b', marginTop: 4 }}>{link.description}</div>
                )}
                <span
                  className={`badge ${link.status}`}
                  style={{ display: 'inline-block', marginTop: 8 }}
                >
                  {STATUS_LABEL[link.status] ?? link.status}
                </span>
              </div>

              {link.status === 'ACTIVE' && !order && link.method === 'PIX' && (
                <button onClick={handleGeneratePix} disabled={submitting} style={{ width: '100%' }}>
                  {submitting ? 'Gerando...' : 'Gerar QR Code Pix'}
                </button>
              )}

              {link.status === 'ACTIVE' && !order && link.method === 'CARD' && (
                <form onSubmit={handlePayCard}>
                  <div className="grid-2">
                    <div>
                      <label>Parcelas</label>
                      <select
                        value={installments}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                      >
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
                        <option value="MASTERCARD">Mastercard</option>
                        <option value="ELO">Elo</option>
                      </select>
                    </div>
                  </div>

                  {(() => {
                    const feePercent = findFee(fees, brand, installments);
                    if (feePercent === null) {
                      return (
                        <p style={{ fontSize: 12, color: 'var(--warning)', marginTop: 8 }}>
                          Taxa não encontrada para {brand} em {installments}x.
                        </p>
                      );
                    }
                    const discountCents = Math.round((link.amountCents * feePercent) / 100);
                    return (
                      <div
                        style={{
                          marginTop: 8,
                          marginBottom: 8,
                          padding: 12,
                          borderRadius: 8,
                          background: '#f8fafc',
                          fontSize: 13,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Taxa</span>
                          <span>{feePercent.toFixed(2)}%</span>
                        </div>
                        <div
                          style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}
                        >
                          <span>Total cobrado</span>
                          <strong>{formatCents(link.amountCents + discountCents)}</strong>
                        </div>
                      </div>
                    );
                  })()}

                  <label>Número do cartão</label>
                  <input
                    required
                    placeholder="4111111111111111"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                  <label>Nome no cartão</label>
                  <input
                    required
                    placeholder="MARIA SILVA"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                  />
                  <div className="grid-2">
                    <div>
                      <label>Validade (mês/ano)</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          required
                          placeholder="MM"
                          maxLength={2}
                          value={expiryMonth}
                          onChange={(e) => setExpiryMonth(e.target.value)}
                        />
                        <input
                          required
                          placeholder="AAAA"
                          maxLength={4}
                          value={expiryYear}
                          onChange={(e) => setExpiryYear(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label>CVV</label>
                      <input
                        required
                        placeholder="123"
                        maxLength={4}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={submitting} style={{ width: '100%' }}>
                    {submitting ? 'Processando...' : 'Pagar'}
                  </button>
                </form>
              )}

              {error && <div className="error">{error}</div>}

              {order?.qrCodeBase64 && (
                <div className="qr-box">
                  <img src={toDataUri(order.qrCodeBase64)} alt="QR Code Pix" />
                  <p style={{ fontSize: 12, wordBreak: 'break-all' }}>{order.emv}</p>
                </div>
              )}

              {order?.status && (
                <div
                  style={{
                    marginTop: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span className={`badge ${order.status}`}>{order.status}</span>
                  <button
                    type="button"
                    className="secondary"
                    disabled={checkingStatus}
                    onClick={handleCheckStatus}
                  >
                    {checkingStatus ? 'Verificando...' : 'Verificar status do pagamento'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
