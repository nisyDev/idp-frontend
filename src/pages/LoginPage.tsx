import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import talentSynkLogo from '../assets/talentsynk-logo.svg';
import talentSynkWordmark from '../assets/talentsynk-wordmark.svg';
import './LoginPage.css';

// ─── ÍCONES ─────────────────────────────────────────────────────────────────
const IconCorporate = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{ display: 'block', flexShrink: 0 }}>
        <rect x="5" y="3" width="14" height="18" rx="2"/>
        <path d="M9 7h1m4 0h1M9 11h1m4 0h1M10 21v-6h4v6"/>
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


const IconArrowRight = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
);

const IconEye = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const IconEyeOff = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/>
        <circle cx="12" cy="12" r="3"/>
        <path d="M2 2l20 20"/>
    </svg>
);

interface LoginPageProps {
    onLogin: (email: string, senha: string, lembrarAcesso: boolean) => Promise<void>;
    ocupado?: boolean;
    restaurandoSessao?: boolean;
    erroLogin?: string;
}

export default function LoginPage({ onLogin, ocupado = false, restaurandoSessao = false, erroLogin = '' }: LoginPageProps) {
    const { theme, mode } = useTheme();
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [lembrarAcesso, setLembrarAcesso] = useState(true);
    const [mostrarSenha, setMostrarSenha] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (ocupado) return;
        const senhaInformada = senha;
        setSenha('');
        void onLogin(email.trim(), senhaInformada, lembrarAcesso);
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
                background: `radial-gradient(circle, ${theme.accentLight}4D 0%, transparent 70%)`,
                top: '-100px', left: '-100px',
                pointerEvents: 'none'
            }} />

            <div style={{
                position: 'absolute',
                width: '700px',
                height: '700px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${theme.gradientBannerEnd}40 0%, transparent 70%)`,
                bottom: '-150px', right: '-100px',
                pointerEvents: 'none'
            }} />

            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `radial-gradient(${theme.cardBorder}66 1px, transparent 1px)`,
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
                borderRadius: '16px',
                border: `1px solid ${theme.cardBorder}40`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 36 }}>
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

                        <h1 style={{
                            fontSize: '1.5rem', fontWeight: 700, color: theme.text,
                            lineHeight: 1.25, letterSpacing: '-0.6px', marginBottom: 12, transition: 'color 0.3s ease'
                        }}>
                            Transformando objetivos em <span style={{
                            backgroundImage: `linear-gradient(135deg, ${theme.accent}, ${theme.accentLight})`,
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
                                <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: `${theme.accentLight}3D`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent, transition: 'all 0.3s ease' }}>
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
                        TalentSynk v1.0.0 © 2026
                    </div>
                </div>

                {/* ── LADO DIREITO: AUTENTICAÇÃO LOCAL ──────────────────────────── */}
                <div style={{ padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: 'all 0.3s ease' }}>
                    <div style={{ marginBottom: 28 }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: theme.text, marginBottom: 4, transition: 'color 0.3s ease' }}>
                            Acessar Plataforma
                        </h2>
                        <p style={{ color: theme.textSecondary, fontSize: '0.85rem', transition: 'color 0.3s ease' }}>
                            Seu perfil será identificado após o login.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} aria-busy={ocupado} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: theme.textTertiary, display: 'block', marginBottom: 6 }}>
                                E-mail corporativo
                            </label>
                            <input
                                type="email"
                                name="email"
                                autoComplete="username"
                                required
                                disabled={ocupado}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={mostrarSenha ? 'text' : 'password'}
                                    className="talentsynk-login-password"
                                    name="password"
                                    autoComplete="current-password"
                                    required
                                    disabled={ocupado}
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    style={{
                                        width: '100%', padding: '11px 40px 11px 14px', borderRadius: '10px',
                                        backgroundColor: theme.inputBackground, border: `1px solid ${theme.inputBorder}`,
                                        color: theme.text, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setMostrarSenha((s) => !s)}
                                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                                    aria-pressed={mostrarSenha}
                                    style={{
                                        position: 'absolute', right: 8, top: 8, border: 'none', background: 'transparent', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible'
                                    }}
                                >
                                    {mostrarSenha ? <IconEyeOff /> : <IconEye />}
                                </button>
                            </div>
                        </div>

                        {/* OPÇÃO LEMBRAR E ESQUECI MINHA SENHA */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: 2 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: theme.textTertiary, cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={lembrarAcesso}
                                    onChange={(e) => setLembrarAcesso(e.target.checked)}
                                    disabled={ocupado}
                                    title="Manter o acesso ao reabrir o navegador enquanto a sessão permanecer válida."
                                    style={{ accentColor: theme.accent }}
                                />
                                Lembrar acesso
                            </label>
                            <a href="#esqueceu" onClick={(e) => e.preventDefault()} style={{ color: theme.accent, textDecoration: 'none', fontWeight: 500 }}>
                                Esqueceu sua senha?
                            </a>
                        </div>

                        {/* BOTÃO ENTRAR */}
                        <button
                            type="submit"
                            disabled={ocupado}
                            style={{
                                marginTop: 6, padding: '13px', borderRadius: '12px', border: 'none',
                                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentLight})`, color: '#FFFFFF',
                                fontWeight: 600, fontSize: '0.925rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: `0 2px 8px ${theme.accent}33`
                            }}
                        >
                            {restaurandoSessao ? 'Verificando sessão...' : ocupado ? 'Entrando...' : 'Entrar na Plataforma'} <IconArrowRight />
                        </button>

                        {erroLogin && (
                            <div role="alert" style={{ color: theme.error, marginTop: 8, fontSize: '0.9rem' }}>{erroLogin}</div>
                        )}
                    </form>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0', color: theme.textTertiary, fontSize: '0.72rem', fontWeight: 600 }}>
                        <span aria-hidden="true" style={{ flex: 1, borderTop: `1px solid ${theme.cardBorder}` }} />
                        <span>OU</span>
                        <span aria-hidden="true" style={{ flex: 1, borderTop: `1px solid ${theme.cardBorder}` }} />
                    </div>

                    <button
                        type="button"
                        disabled
                        aria-describedby="corporate-login-unavailable"
                        style={{
                            width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '13px 14px', borderRadius: '12px',
                            border: `1px solid ${theme.cardBorder}`,
                            backgroundColor: mode === 'dark' ? theme.backgroundSecondary : theme.text,
                            color: mode === 'dark' ? theme.textSecondary : theme.cardBackground,
                            fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.4,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                            cursor: 'not-allowed', transition: 'background-color 0.3s ease, color 0.3s ease'
                        }}
                    >
                        <IconCorporate />
                        <span>Entrar com a conta corporativa</span>
                    </button>
                    <p id="corporate-login-unavailable" style={{ margin: '8px 0 0', textAlign: 'center', color: theme.textSecondary, fontSize: '0.72rem' }}>
                        Indisponível no momento
                    </p>


                </div>

            </div>

        </div>
    );
}
