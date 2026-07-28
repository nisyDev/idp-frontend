import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// ─── ÍCONES ─────────────────────────────────────────────────────────────────
const IconUser = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
);

const IconBriefcase = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
);

const IconShield = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
);

const IconTrendingUp = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
);

const IconTarget = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
);

const IconMessageSquare = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
);

const IconMicrosoft = () => (
    <svg width="18" height="18" viewBox="0 0 23 23">
        <path fill="#f35325" d="M1 1h10v10H1z"/>
        <path fill="#81bc06" d="M12 1h10v10H12z"/>
        <path fill="#05a6f0" d="M1 12h10v10H1z"/>
        <path fill="#ffba08" d="M12 12h10v10H12z"/>
    </svg>
);

const IconArrowRight = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
);

interface LoginPageProps {
    onLogin: (perfil: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
    const { theme } = useTheme();
    const [perfilSelecionado, setPerfilSelecionado] = useState<'COLABORADOR' | 'GESTOR' | 'RH'>('COLABORADOR');
    const [lembrarAcesso, setLembrarAcesso] = useState(true);

    // Mapeamento dos e-mails da BGP como na sua tela antiga
    const dadosPorPerfil = {
        COLABORADOR: { nome: 'Ana Lima', email: 'ana.lima@bgp.com' },
        GESTOR: { nome: 'Diego Rocha', email: 'diego.rocha@bgp.com' },
        RH: { nome: 'Gustavo Alves', email: 'gustavo.alves@bgp.com' },
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(perfilSelecionado);
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            backgroundColor: theme.background,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: "'Inter', sans-serif",
            transition: 'background-color 0.3s ease'
        }}>

            {/* ── ILUMINAÇÃO DE FUNDO (GLOW & TEXTURA) ──────────────────────────── */}
            <div style={{
                position: 'absolute',
                width: '600px',
                height: '600px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(0, 0, 0, 0) 70%)',
                top: '-100px', left: '-100px',
                pointerEvents: 'none'
            }} />

            <div style={{
                position: 'absolute',
                width: '700px',
                height: '700px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
                bottom: '-150px', right: '-100px',
                pointerEvents: 'none'
            }} />

            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
                pointerEvents: 'none', opacity: 0.6
            }} />

            {/* ── CONTAINER PRINCIPAL DUAL-PANEL ────────────────────────────────── */}
            <div style={{
                position: 'relative',
                zIndex: 10,
                width: '100%',
                maxWidth: '1080px',
                margin: '24px',
                display: 'grid',
                gridTemplateColumns: '1.05fr 0.95fr',
                backgroundColor: `${theme.background}CC`,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: `1px solid ${theme.cardBorder}40`,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.1)',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
            }}>

                {/* ── LADO ESQUERDO: APRESENTAÇÃO E RECURSOS DA TELA ANTIGA ────────── */}
                <div style={{
                    padding: '48px 40px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: `linear-gradient(145deg, ${theme.cardBackground}80 0%, ${theme.background}D9 100%)`,
                    borderRight: `1px solid ${theme.cardBorder}40`,
                    transition: 'all 0.3s ease'
                }}>
                    <div>
                        {/* Logo */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
                            <div style={{
                                width: 42, height: 42, borderRadius: 12,
                                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentLight})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.35rem', fontWeight: 800, color: '#fff',
                                boxShadow: `0 8px 20px ${theme.accent}66`,
                                transition: 'all 0.3s ease'
                            }}>
                                T
                            </div>
                            <div>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: theme.text, letterSpacing: '-0.3px', display: 'block', transition: 'color 0.3s ease' }}>
                  TalentSynk
                </span>
                                <span style={{ color: theme.textSecondary, fontSize: '0.72rem', transition: 'color 0.3s ease' }}>Plataforma de PDI</span>
                            </div>
                        </div>

                        <h1 style={{
                            fontSize: '2rem', fontWeight: 800, color: theme.text,
                            lineHeight: 1.25, letterSpacing: '-0.6px', marginBottom: 12, transition: 'color 0.3s ease'
                        }}>
                            Transformando objetivos em <span style={{
                            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentLight})`,
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', transition: 'all 0.3s ease'
                        }}>evolução profissional</span>.
                        </h1>

                        <p style={{ color: theme.textSecondary, fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 32, transition: 'color 0.3s ease' }}>
                            Acompanhe competências, planos de desenvolvimento, feedbacks e evolução profissional em um único ambiente.
                        </p>

                        {/* CARDS DE RECURSOS (IGUAIS À SUA TELA ANTIGA COM ESTILO DARK) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                            <div style={{
                                padding: '14px 16px', borderRadius: '14px',
                                backgroundColor: `${theme.cardBackground}80`,
                                border: `1px solid ${theme.cardBorder}40`,
                                display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.3s ease'
                            }}>
                                <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: `${theme.accent}26`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent, transition: 'all 0.3s ease' }}>
                                    <IconTrendingUp />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: theme.text, transition: 'color 0.3s ease' }}>Desenvolvimento Contínuo</div>
                                    <div style={{ fontSize: '0.75rem', color: theme.textSecondary, transition: 'color 0.3s ease' }}>Acompanhe sua evolução profissional.</div>
                                </div>
                            </div>

                            <div style={{
                                padding: '14px 16px', borderRadius: '14px',
                                backgroundColor: `${theme.cardBackground}80`,
                                border: `1px solid ${theme.cardBorder}40`,
                                display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.3s ease'
                            }}>
                                <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: `${theme.accentLight}26`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accentLight, transition: 'all 0.3s ease' }}>
                                    <IconTarget />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: theme.text, transition: 'color 0.3s ease' }}>Plano de Desenvolvimento</div>
                                    <div style={{ fontSize: '0.75rem', color: theme.textSecondary, transition: 'color 0.3s ease' }}>Organize objetivos, atividades e resultados.</div>
                                </div>
                            </div>

                            <div style={{
                                padding: '14px 16px', borderRadius: '14px',
                                backgroundColor: `${theme.cardBackground}80`,
                                border: `1px solid ${theme.cardBorder}40`,
                                display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.3s ease'
                            }}>
                                <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: '#38BDF826', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8', transition: 'all 0.3s ease' }}>
                                    <IconMessageSquare />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: theme.text, transition: 'color 0.3s ease' }}>Feedbacks</div>
                                    <div style={{ fontSize: '0.75rem', color: theme.textSecondary, transition: 'color 0.3s ease' }}>Fortaleça o desenvolvimento com trocas estruturadas.</div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div style={{ color: theme.textSecondary, fontSize: '0.72rem', marginTop: 24, transition: 'color 0.3s ease' }}>
                        TalentSynk v1.0.0 • BGP © 2026
                    </div>
                </div>

                {/* ── LADO DIREITO: FORMULÁRIO COM 3 PERFIS + LOGIN MICROSOFT ─────── */}
                <div style={{ padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: 'all 0.3s ease' }}>
                    <div style={{ marginBottom: 28 }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: theme.text, marginBottom: 4, transition: 'color 0.3s ease' }}>
                            Acessar Plataforma
                        </h2>
                        <p style={{ color: theme.textSecondary, fontSize: '0.85rem', transition: 'color 0.3s ease' }}>
                            Selecione o perfil de demonstração para entrar
                        </p>
                    </div>

                    {/* SELETOR DOS 3 PERFIS DA TELA ANTIGA */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.textTertiary, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                            Perfil de Acesso
                        </label>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                            {/* COLABORADOR */}
                            <button
                                type="button"
                                onClick={() => setPerfilSelecionado('COLABORADOR')}
                                style={{
                                    padding: '10px 8px', borderRadius: '10px',
                                    border: perfilSelecionado === 'COLABORADOR' ? `2px solid ${theme.accent}` : `1px solid ${theme.inputBorder}`,
                                    backgroundColor: perfilSelecionado === 'COLABORADOR' ? `${theme.accent}2E` : theme.inputBackground,
                                    color: perfilSelecionado === 'COLABORADOR' ? theme.text : theme.textTertiary,
                                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease'
                                }}
                            >
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                    <IconUser /> Colaborador
                                </div>
                                <div style={{ fontSize: '0.68rem', color: perfilSelecionado === 'COLABORADOR' ? theme.accent : theme.textTertiary, marginTop: 2 }}>
                                    Ana
                                </div>
                            </button>

                            {/* GESTOR */}
                            <button
                                type="button"
                                onClick={() => setPerfilSelecionado('GESTOR')}
                                style={{
                                    padding: '10px 8px', borderRadius: '10px',
                                    border: perfilSelecionado === 'GESTOR' ? `2px solid ${theme.accent}` : `1px solid ${theme.inputBorder}`,
                                    backgroundColor: perfilSelecionado === 'GESTOR' ? `${theme.accent}2E` : theme.inputBackground,
                                    color: perfilSelecionado === 'GESTOR' ? theme.text : theme.textTertiary,
                                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease'
                                }}
                            >
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                    <IconBriefcase /> Gestor
                                </div>
                                <div style={{ fontSize: '0.68rem', color: perfilSelecionado === 'GESTOR' ? theme.accent : theme.textTertiary, marginTop: 2 }}>
                                    Diego
                                </div>
                            </button>

                            {/* RH / ADMIN */}
                            <button
                                type="button"
                                onClick={() => setPerfilSelecionado('RH')}
                                style={{
                                    padding: '10px 8px', borderRadius: '10px',
                                    border: perfilSelecionado === 'RH' ? `2px solid ${theme.accent}` : `1px solid ${theme.inputBorder}`,
                                    backgroundColor: perfilSelecionado === 'RH' ? `${theme.accent}2E` : theme.inputBackground,
                                    color: perfilSelecionado === 'RH' ? theme.text : theme.textTertiary,
                                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease'
                                }}
                            >
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                    <IconShield /> RH
                                </div>
                                <div style={{ fontSize: '0.68rem', color: perfilSelecionado === 'RH' ? theme.accent : theme.textTertiary, marginTop: 2 }}>
                                    Gustavo
                                </div>
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: theme.textTertiary, display: 'block', marginBottom: 6 }}>
                                E-mail corporativo
                            </label>
                            <input
                                type="email"
                                readOnly
                                value={dadosPorPerfil[perfilSelecionado].email}
                                style={{
                                    width: '100%', padding: '11px 14px', borderRadius: '10px',
                                    backgroundColor: theme.inputBackground, border: `1px solid ${theme.inputBorder}`,
                                    color: theme.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: theme.textTertiary, display: 'block', marginBottom: 6 }}>
                                Senha
                            </label>
                            <input
                                type="password"
                                readOnly
                                value="123456"
                                style={{
                                    width: '100%', padding: '11px 14px', borderRadius: '10px',
                                    backgroundColor: theme.inputBackground, border: `1px solid ${theme.inputBorder}`,
                                    color: theme.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* OPÇÃO LEMBRAR E ESQUECI MINHA SENHA */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: 2 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: theme.textTertiary, cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={lembrarAcesso}
                                    onChange={(e) => setLembrarAcesso(e.target.checked)}
                                    style={{ accentColor: theme.accent }}
                                />
                                Lembrar acesso
                            </label>
                            <a href="#esqueceu" onClick={(e) => e.preventDefault()} style={{ color: theme.accent, textDecoration: 'none', fontWeight: 500 }}>
                                Esqueceu minha senha?
                            </a>
                        </div>

                        {/* BOTÃO ENTRAR */}
                        <button
                            type="submit"
                            style={{
                                marginTop: 6, padding: '13px', borderRadius: '12px', border: 'none',
                                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentLight})`, color: '#FFFFFF',
                                fontWeight: 600, fontSize: '0.925rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: `0 4px 14px ${theme.accent}66`
                            }}
                        >
                            Entrar na Plataforma <IconArrowRight />
                        </button>
                    </form>

                    {/* DIVISOR "OU" */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
                        <div style={{ flex: 1, height: '1px', backgroundColor: theme.cardBorder }} />
                        <span style={{ fontSize: '0.75rem', color: theme.textTertiary, fontWeight: 600 }}>ou</span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: theme.cardBorder }} />
                    </div>

                    {/* BOTÃO ENTRAR COM MICROSOFT */}
                    <button
                        type="button"
                        onClick={() => onLogin(perfilSelecionado)}
                        style={{
                            padding: '12px', borderRadius: '12px',
                            border: `1px solid ${theme.cardBorder}`,
                            backgroundColor: theme.cardBackground, color: theme.text,
                            fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <IconMicrosoft /> Entrar com Microsoft
                    </button>

                    <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.78rem', color: theme.textTertiary }}>
                        Não possui acesso? <a href="#solicite" onClick={(e) => e.preventDefault()} style={{ color: theme.accent, textDecoration: 'none', fontWeight: 600 }}>Solicite acesso ao RH</a>
                    </div>

                </div>

            </div>

        </div>
    );
}