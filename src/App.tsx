import { useCallback, useEffect, useRef, useState } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { autenticar, consultarSessao, encerrarSessao } from './services/auth';
import type { UsuarioAutenticado } from './services/auth';
import { ApiError } from './services/http';
import talentSynkLogo from './assets/talentsynk-logo.svg';
import talentSynkWordmark from './assets/talentsynk-wordmark.svg';

// Importação das Telas
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PerfilPage from './pages/PerfilPage';
import PdiPage from './pages/PdiPage';
import ReunioesPage from './pages/ReunioesPage';
import DesenvolvimentoPage from './pages/DesenvolvimentoPage';
import OrganomaPage from './pages/OrganomaPage';
import SugestoesPage from './pages/SugestoesPage';

// ─── Ícones (Lucide Style) ───────────────────────────────────────────────────
const IconHome = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
);
const IconCalendar = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);
const IconTarget = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
);
const IconBook = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
);
const IconLogOut = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
);
const IconMenu = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
);
const IconOrganograma = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="6" height="5" rx="1"/><rect x="15" y="3" width="6" height="5" rx="1"/><rect x="3" y="14" width="6" height="6" rx="1"/><rect x="15" y="14" width="6" height="6" rx="1"/><line x1="9" y1="5.5" x2="15" y2="5.5"/><line x1="9" y1="17" x2="15" y2="17"/>
    </svg>
);
const IconSun = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
);
const IconMoon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
);

const IconLightbulb = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6"/>
        <path d="M10 22h4"/>
        <path d="M14 10.5A4 4 0 1 0 10 10.5c0 2 1 3 1 4h2c0-1 1-2 1-4z"/>
    </svg>
);

type OperacaoAutenticacao = 'restaurando' | 'entrando' | 'saindo' | null;

function AppContent() {
    const { theme, mode, toggleTheme } = useTheme();
    const [usuarioLogado, setUsuarioLogado] = useState<(UsuarioAutenticado & { iniciais: string }) | null>(null);
    const [operacao, setOperacao] = useState<OperacaoAutenticacao>('restaurando');
    const [erroAutenticacao, setErroAutenticacao] = useState('');
    const operacaoAtual = useRef<OperacaoAutenticacao>(null);
    const requisicaoAtual = useRef<AbortController | null>(null);
    const geracao = useRef(0);
    const identidadeAtual = useRef<UsuarioAutenticado | null>(null);

    const [telaAtiva, setTelaAtiva] = useState<'dashboard' | 'perfil' | 'pdi' | 'reunioes' | 'desenvolvimento' | 'organograma' | 'sugestoes'>('dashboard');
    const [sidebarAberta, setSidebarAberta] = useState(true);

    const registrarIdentidade = useCallback((usuario: UsuarioAutenticado | null) => {
        identidadeAtual.current = usuario;
        setUsuarioLogado(usuario ? {
            ...usuario,
            iniciais: usuario.nome.trim().split(/\s+/).map(parte => parte.charAt(0)).join('').slice(0, 2).toUpperCase(),
        } : null);
    }, []);

    useEffect(() => {
        let ativo = true;
        const verificarSessao = async () => {
            // Session reads must never interrupt or race a login/logout mutation.
            if (operacaoAtual.current !== null) return;
            const controller = new AbortController();
            const atual = ++geracao.current;
            operacaoAtual.current = 'restaurando';
            requisicaoAtual.current = controller;
            setOperacao('restaurando');
            const vigente = () => ativo && !controller.signal.aborted && atual === geracao.current;
            try {
                const usuario = await consultarSessao(controller.signal);
                if (!vigente()) return;
                if (!usuario && identidadeAtual.current) {
                    setErroAutenticacao('Sua sessão foi encerrada. Entre novamente.');
                    setTelaAtiva('dashboard');
                } else {
                    setErroAutenticacao('');
                }
                registrarIdentidade(usuario);
            } catch (error) {
                if (vigente()) {
                    setErroAutenticacao(error instanceof ApiError
                        ? error.message : 'Não foi possível verificar a sessão. Tente novamente.');
                }
            } finally {
                if (vigente()) {
                    operacaoAtual.current = null;
                    requisicaoAtual.current = null;
                    setOperacao(null);
                }
            }
        };
        const aoRetomar = () => {
            if (document.visibilityState === 'visible') void verificarSessao();
        };
        void verificarSessao();
        window.addEventListener('focus', aoRetomar);
        document.addEventListener('visibilitychange', aoRetomar);
        return () => {
            ativo = false;
            geracao.current += 1;
            requisicaoAtual.current?.abort();
            requisicaoAtual.current = null;
            operacaoAtual.current = null;
            window.removeEventListener('focus', aoRetomar);
            document.removeEventListener('visibilitychange', aoRetomar);
        };
    }, [registrarIdentidade]);

    const handleSessaoPdiExpirada = useCallback((usuarioId: string) => {
        if (identidadeAtual.current?.id !== usuarioId
            || operacaoAtual.current === 'entrando'
            || operacaoAtual.current === 'saindo') return;

        // A late session check must not restore an identity rejected by the API.
        geracao.current += 1;
        requisicaoAtual.current?.abort();
        requisicaoAtual.current = null;
        operacaoAtual.current = null;
        setOperacao(null);
        registrarIdentidade(null);
        setTelaAtiva('dashboard');
        setErroAutenticacao('Sua sessão foi encerrada. Entre novamente.');
    }, [registrarIdentidade]);

    const handleLogin = async (email: string, senha: string, lembrarAcesso: boolean): Promise<void> => {
        if (operacaoAtual.current !== null) return;
        const controller = new AbortController();
        const atual = ++geracao.current;
        operacaoAtual.current = 'entrando';
        requisicaoAtual.current = controller;
        setOperacao('entrando');
        setErroAutenticacao('');
        try {
            const usuario = await autenticar(email, senha, lembrarAcesso, controller.signal);
            if (controller.signal.aborted || atual !== geracao.current) return;
            registrarIdentidade(usuario);
            setTelaAtiva('dashboard');
        } catch (error) {
            if (!controller.signal.aborted && atual === geracao.current) {
                setErroAutenticacao(error instanceof ApiError
                    ? error.message : 'Não foi possível entrar. Tente novamente.');
            }
        } finally {
            if (!controller.signal.aborted && atual === geracao.current) {
                operacaoAtual.current = null;
                requisicaoAtual.current = null;
                setOperacao(null);
            }
        }
    };

    const handleLogout = async (): Promise<void> => {
        if (operacaoAtual.current !== null) return;
        const controller = new AbortController();
        const atual = ++geracao.current;
        operacaoAtual.current = 'saindo';
        requisicaoAtual.current = controller;
        setOperacao('saindo');
        setErroAutenticacao('');
        try {
            await encerrarSessao(controller.signal);
            if (controller.signal.aborted || atual !== geracao.current) return;
            registrarIdentidade(null);
            setTelaAtiva('dashboard');
        } catch {
            if (!controller.signal.aborted && atual === geracao.current) {
                // A network failure does not prove that the server invalidated its session.
                setErroAutenticacao('Não foi possível confirmar a saída. Tente novamente.');
            }
        } finally {
            if (!controller.signal.aborted && atual === geracao.current) {
                operacaoAtual.current = null;
                requisicaoAtual.current = null;
                setOperacao(null);
            }
        }
    };

    if (!usuarioLogado) {
        return <LoginPage onLogin={handleLogin} ocupado={operacao !== null}
                          restaurandoSessao={operacao === 'restaurando'} erroLogin={erroAutenticacao} />;
    }

    const menuItems = [
        { id: 'dashboard', label: 'Início', icon: <IconHome /> },
        { id: 'pdi', label: 'PDI', icon: <IconTarget /> },
        { id: 'reunioes', label: 'Reuniões 1:1', icon: <IconCalendar /> },
        { id: 'desenvolvimento', label: 'Capacitação & Trilha', icon: <IconBook /> },
        { id: 'organograma', label: 'Organograma', icon: <IconOrganograma /> },
        { id: 'sugestoes', label: 'Sugestões', icon: <IconLightbulb /> },
    ] as const;

    return (
        <div key={usuarioLogado.id} style={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.background, fontFamily: "'Inter', sans-serif", transition: 'background-color 0.3s ease' }}>

            <style>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes slideOut {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                }
                
                @keyframes sidebarSlideIn {
                    from {
                        transform: translateX(-100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
                
                @keyframes sidebarSlideOut {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(-100%);
                    }
                }
                
                .sidebar {
                    animation: sidebarSlideIn 0.35s ease-out forwards;
                }
                
                .sidebar.fechada {
                    animation: sidebarSlideOut 0.35s ease-out forwards;
                }
                
                .page-content {
                    animation: slideIn 0.4s ease-out forwards;
                }
                
                .overlay {
                    animation: fadeIn 0.3s ease-out forwards;
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
            `}</style>

            {/* ── OVERLAY QUANDO SIDEBAR ESTÁ ABERTA ──────────────────────────── */}
            {sidebarAberta && (
                <div
                    className="overlay"
                    onClick={() => setSidebarAberta(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        zIndex: 40,
                        cursor: 'pointer'
                    }}
                />
            )}

            {/* ── SIDEBAR NA ESQUERDA ───────────────────────────────────────────── */}
            <aside className={sidebarAberta ? 'sidebar' : 'sidebar fechada'} style={{
                width: 260,
                backgroundColor: theme.sidebarBackground,
                color: theme.sidebarText,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px 16px',
                position: 'fixed',
                top: 0,
                bottom: 0,
                left: 0,
                zIndex: sidebarAberta ? 50 : -1,
                boxShadow: '1px 0 3px rgba(0,0,0,0.03)',
                transition: 'all 0.3s ease'
            }}>
                <div>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 12px', marginBottom: 36 }}>
                        <img
                            src={talentSynkLogo}
                            alt=""
                            width={72}
                            height={72}
                            style={{ display: 'block', flexShrink: 0, objectFit: 'contain' }}
                        />
                        <div style={{ minWidth: 0 }}>
                            <img
                                src={talentSynkWordmark}
                                alt="TalentSynk"
                                width={128}
                                height={22}
                                style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                            />
                        </div>
                    </div>

                    {/* Menus */}
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {menuItems.map((item) => {
                            const isActive = telaAtiva === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setTelaAtiva(item.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '12px 16px', borderRadius: 12, border: 'none',
                                        backgroundColor: isActive ? theme.accent : 'transparent',
                                        color: isActive ? '#FFFFFF' : theme.textTertiary,
                                        fontWeight: isActive ? 600 : 500,
                                        fontSize: '0.9rem', cursor: 'pointer', transition: 'all 150ms ease-in-out',
                                        textAlign: 'left', width: '100%'
                                    }}
                                >
                                    <span style={{ color: isActive ? '#FFFFFF' : theme.textTertiary }}>{item.icon}</span>
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Rodapé da Sidebar com Usuário */}
                <div style={{
                    borderTop: `1px solid ${theme.cardBorder}`,
                    paddingTop: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0 4px' }}>
                        <button
                            onClick={() => setTelaAtiva('perfil')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px',
                                backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                                transition: 'all 150ms ease-in-out', flex: 1, textAlign: 'left'
                            }}
                        >
                            <div style={{
                                width: 38, height: 38, borderRadius: '50%',
                                backgroundColor: theme.accentLight,
                                border: `1.5px solid ${theme.accent}`,
                                color: theme.accent, fontWeight: 700, fontSize: '0.85rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {usuarioLogado.iniciais}
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: theme.sidebarText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {usuarioLogado.nome}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: theme.accent, fontWeight: 600 }}>
                                    {usuarioLogado.perfil}
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={toggleTheme}
                            title={mode === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
                            style={{
                                width: 36, height: 36, borderRadius: 10, padding: 0, border: `1px solid ${theme.cardBorder}`,
                                backgroundColor: theme.cardBackground, color: theme.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                            }}
                        >
                            {mode === 'dark' ? <IconSun /> : <IconMoon />}
                        </button>
                    </div>

                    <button
                        onClick={handleLogout}
                        disabled={operacao !== null}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 16px', borderRadius: 10,
                            backgroundColor: theme.cardBackground, border: `1px solid ${theme.cardBorder}`,
                            color: theme.error, fontSize: '0.825rem', fontWeight: 600,
                            cursor: 'pointer', transition: 'all 150ms', alignSelf: 'center'
                        }}
                    >
                        <IconLogOut />
                        <span style={{ marginLeft: 6 }}>{operacao === 'saindo' ? 'Saindo...' : 'Sair / Trocar Conta'}</span>
                    </button>
                    {erroAutenticacao && (
                        <div role="alert" style={{ color: theme.error, fontSize: '0.9rem' }}>{erroAutenticacao}</div>
                    )}
                </div>
            </aside>

            {/* ── CONTEÚDO PRINCIPAL ──────────────────────────────────────────── */}
            <main style={{ flex: 1, marginLeft: sidebarAberta ? 260 : 0, padding: '32px 40px', minHeight: '100vh', transition: 'margin-left 0.35s ease-out' }} className="page-content">
                {/* Botão de Hambúrguer */}
                {!sidebarAberta && (
                    <button
                        onClick={() => setSidebarAberta(true)}
                        style={{
                            position: 'fixed',
                            top: '32px',
                            left: '32px',
                            zIndex: 60,
                            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentLight})`,
                            border: 'none',
                            color: '#FFFFFF',
                            padding: '12px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 2px 8px ${theme.accent}33`,
                            transition: 'all 200ms ease-out'
                        }}
                    >
                        <IconMenu />
                    </button>
                )}

                {telaAtiva === 'dashboard' && <DashboardPage nomeUsuario={usuarioLogado.nome} perfil={usuarioLogado.perfil} />}
                {telaAtiva === 'perfil' && <PerfilPage nomeUsuario={usuarioLogado.nome} perfil={usuarioLogado.perfil} />}
                {telaAtiva === 'pdi' && <PdiPage usuario={usuarioLogado} onSessaoExpirada={handleSessaoPdiExpirada} />}
                {telaAtiva === 'reunioes' && <ReunioesPage nomeUsuario={usuarioLogado.nome} perfil={usuarioLogado.perfil} />}
                {telaAtiva === 'desenvolvimento' && <DesenvolvimentoPage nomeUsuario={usuarioLogado.nome} perfil={usuarioLogado.perfil} />}
                {telaAtiva === 'organograma' && <OrganomaPage nomeUsuario={usuarioLogado.nome} perfil={usuarioLogado.perfil} />}
                {telaAtiva === 'sugestoes' && <SugestoesPage nomeUsuario={usuarioLogado.nome} /> }
            </main>

        </div>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}
