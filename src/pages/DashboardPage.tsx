import { useTheme } from '../contexts/ThemeContext';

const IconTarget = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
);

const IconMessageSquare = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const IconCalendar = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const IconMegaphone = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
);

const IconArrowRight = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
);

const IconSparkles = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
    </svg>
);

interface DashboardPageProps {
    nomeUsuario?: string;
    perfil?: string;
}

export default function DashboardPage({
    nomeUsuario = 'Ana Lima',
    perfil = 'COLABORADOR',
}: DashboardPageProps) {
    const { theme } = useTheme();
    const primeiroNome = nomeUsuario.split(' ')[0];
    const tipoUsuario = perfil.charAt(0).toUpperCase() + perfil.slice(1).toLowerCase();
    const progressoDesenvolvimento = 45;

    const indicadores = [
        { label: "PDI's ativos", value: 1, icon: <IconTarget /> },
        { label: 'Feedbacks recebidos', value: 3, icon: <IconMessageSquare /> },
        { label: 'Reuniões agendadas', value: 2, icon: <IconCalendar /> },
    ];

    const comunicados = [
        {
            titulo: 'Novo benefício: auxílio home office',
            texto: 'A partir de julho, todo colaborador receberá R$ 120/mês de auxílio home office, creditado junto com o pagamento.',
            data: '10/06/2026',
            novo: true,
        },
        {
            titulo: 'Manutenção do sistema de ponto — sábado',
            texto: 'No sábado 13/06 das 08h às 12h o sistema de ponto ficará indisponível. Registros serão ajustados automaticamente.',
            data: '08/06/2026',
            novo: true,
        },
        {
            titulo: 'Ciclo semestral de avaliação — 2026/S1',
            texto: 'Abrimos hoje o ciclo de avaliação semestral. Autoavaliações devem ser preenchidas até 30/06.',
            data: '05/06/2026',
            novo: false,
        },
    ];

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 40, fontFamily: "'Inter', sans-serif" }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 28,
                gap: 16,
            }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: theme.text, margin: '0 0 4px 0' }}>
                        Bem vindo de volta, {primeiroNome}
                    </h1>
                    <p style={{ color: theme.textSecondary, fontSize: '0.875rem', margin: 0 }}>
                        Acompanhe seus indicadores, comunicados e próximos compromissos.
                    </p>
                </div>

                <div style={{
                    padding: '10px 16px',
                    borderRadius: 999,
                    backgroundColor: theme.cardBackground,
                    border: `1px solid ${theme.cardBorder}`,
                    color: theme.text,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(15, 131, 200, 0.08)',
                }}>
                    {tipoUsuario}
                </div>
            </div>

            <section style={{
                background: `linear-gradient(135deg, ${theme.gradientBannerStart}, ${theme.gradientBannerEnd})`,
                borderRadius: 16,
                padding: '32px',
                marginBottom: 28,
                color: '#062544',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}>
                <div style={{ fontSize: '0.95rem', marginBottom: 10 }}>Bem-vindo de volta,</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>{primeiroNome}</div>
                <div style={{ fontSize: '1rem' }}>
                    Construa seu PDI, receba feedbacks e prepare suas próximas 1:1.
                </div>
            </section>

            <section style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 20,
                marginBottom: 28,
            }}>
                {indicadores.map((item) => (
                    <div key={item.label} style={{
                        backgroundColor: theme.cardBackground,
                        border: `1px solid ${theme.cardBorder}`,
                        borderRadius: 16,
                        padding: '20px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 18,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}>
                        <div style={{
                            width: 58,
                            height: 58,
                            borderRadius: 16,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: theme.accent,
                            backgroundColor: `${theme.accentLight}66`,
                            flexShrink: 0,
                        }}>
                            {item.icon}
                        </div>
                        <div>
                            <div style={{ color: theme.text, fontSize: '1.75rem', lineHeight: 1, fontWeight: 700 }}>
                                {item.value}
                            </div>
                            <div style={{ color: theme.textSecondary, fontSize: '0.9rem', marginTop: 6 }}>
                                {item.label}
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            <section style={{
                backgroundColor: theme.cardBackground,
                border: `1px solid ${theme.cardBorder}`,
                borderRadius: 16,
                padding: '24px 28px',
                marginBottom: 28,
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.text, fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>
                    <span>Indicador de desenvolvimento</span>
                    <span>{progressoDesenvolvimento}%</span>
                </div>
                <div style={{ width: '100%', height: 10, borderRadius: 999, backgroundColor: theme.backgroundSecondary, overflow: 'hidden' }}>
                    <div style={{
                        width: `${progressoDesenvolvimento}%`,
                        height: '100%',
                        borderRadius: 999,
                        backgroundColor: theme.accent,
                    }} />
                </div>
            </section>

            <section style={{
                backgroundColor: theme.cardBackground,
                border: `1px solid ${theme.cardBorder}`,
                borderRadius: 16,
                padding: '24px 28px',
                marginBottom: 28,
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: theme.accent, display: 'flex' }}><IconMegaphone /></span>
                        <div>
                            <h2 style={{ color: theme.text, fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Comunicados do RH</h2>
                            <p style={{ color: theme.textSecondary, fontSize: '0.875rem', margin: '6px 0 0 0' }}>Enviados por rh@empresa.com · 2 não lidos</p>
                        </div>
                    </div>
                    <a
                        href="#portal-rh"
                        style={{
                            color: theme.text,
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 14,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Abrir portal <IconArrowRight />
                    </a>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {comunicados.map((item) => (
                        <div key={item.titulo} style={{
                            border: `1px solid ${theme.accentLight}`,
                            borderRadius: 12,
                            padding: '14px 16px',
                            backgroundColor: theme.backgroundSecondary,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'baseline' }}>
                                <div style={{ color: theme.text, fontSize: '1rem', fontWeight: 700 }}>
                                    {item.titulo}
                                    {item.novo && (
                                        <span style={{
                                            marginLeft: 10,
                                            padding: '2px 8px',
                                            borderRadius: 999,
                                            backgroundColor: theme.accent,
                                            color: '#FFFFFF',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                        }}>
                                            novo
                                        </span>
                                    )}
                                </div>
                                <div style={{ color: theme.textSecondary, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{item.data}</div>
                            </div>
                            <p style={{
                                color: theme.textSecondary,
                                fontSize: '0.875rem',
                                margin: '4px 0 0 0',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {item.texto}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section style={{
                backgroundColor: theme.cardBackground,
                border: `1px solid ${theme.accentLight}`,
                borderRadius: 16,
                padding: '24px 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 20,
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <div style={{
                        width: 60,
                        height: 60,
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `linear-gradient(135deg, ${theme.gradientBannerStart}, ${theme.gradientBannerEnd})`,
                        color: '#FFFFFF',
                        flexShrink: 0,
                    }}>
                        <IconSparkles />
                    </div>
                    <div>
                        <div style={{ color: theme.textSecondary, fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            Próxima reunião semestral
                        </div>
                        <div style={{ color: theme.text, fontSize: '1rem', fontWeight: 700, marginTop: 6 }}>
                            Reunião geral semestral — avaliação 2026/S1
                        </div>
                        <div style={{ color: theme.textSecondary, fontSize: '0.9rem', marginTop: 4 }}>
                            20/07/2026 às 15:00
                        </div>
                    </div>
                </div>

                <button style={{
                    padding: '10px 18px',
                    borderRadius: 12,
                    border: `1px solid ${theme.cardBorder}`,
                    backgroundColor: theme.cardBackground,
                    color: theme.text,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}>
                    Abrir
                </button>
            </section>
        </div>
    );
}
