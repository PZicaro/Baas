import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import GatewayConnectModal from './GatewayConnectModal';
import { useAuth } from '../context/AuthContext';
import { useGatewayStatus } from '../hooks/useGatewayStatus';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { status, loading: statusLoading, refresh: refreshGatewayStatus } = useGatewayStatus();

  const [gatewayModalOpen, setGatewayModalOpen] = useState(false);
  const [autoPromptShown, setAutoPromptShown] = useState(false);

  // Assim que a sessão do BaaS carrega, se a loja ainda não estiver
  // conectada ao gateway, o popup aparece sozinho — em vez de ficar
  // escondido atrás de um item de menu que ninguém clica.
  useEffect(() => {
    if (statusLoading || autoPromptShown) return;
    if (status && !status.connected) {
      setGatewayModalOpen(true);
    }
    setAutoPromptShown(true);
  }, [status, statusLoading, autoPromptShown]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>VBA Systems</h1>
        <NavLink to="/" end>
          Carteira
        </NavLink>
        <NavLink to="/checkout">Checkout</NavLink>
        <NavLink to="/withdrawals">Saques</NavLink>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setGatewayModalOpen(true);
          }}
        >
          Conta no gateway
        </a>
        <div style={{ marginTop: 'auto', paddingTop: 24, fontSize: 12, color: '#94a3b8' }}>
          {user?.email}
          <br />
          <a href="#" onClick={handleLogout} style={{ color: '#f87171' }}>
            Sair
          </a>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>

      <GatewayConnectModal
        open={gatewayModalOpen}
        onClose={() => setGatewayModalOpen(false)}
        onConnected={refreshGatewayStatus}
        status={status}
      />
    </div>
  );
}
