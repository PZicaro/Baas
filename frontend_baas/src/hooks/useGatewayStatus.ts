import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

export interface GatewayStatus {
  connected: boolean;
  codigoCliente?: string | null;
  gatewayEmail?: string | null;
  active?: boolean;
}

/** Consulta GET /gateway/status: se a loja logada já está conectada ao gateway Lera Box. */
export function useGatewayStatus() {
  const [status, setStatus] = useState<GatewayStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    return api
      .get<GatewayStatus>('/gateway/status')
      .then(({ data }) => setStatus(data))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, loading, refresh };
}
