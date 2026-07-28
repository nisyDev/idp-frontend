import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// ─── ÍCONES ─────────────────────────────────────────────────────────────────
const IconCalendar = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const IconPlus = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

interface Meeting {
    id: string;
    titulo: string;
    dataHora: string;
    status: 'Agendada' | 'Realizada';
    participante: string;
    pauta: string;
}

export default function ReunioesPage() {
    const { theme } = useTheme();
    const [reunioes] = useState<Meeting[]>([
        {
            id: '1',
            titulo: '1:1 de Alinhamento Trimestral de Carreira',
            dataHora: '05/08/2026 às 14:00',
            status: 'Agendada',
            participante: 'Diego Rocha (Gestor)',
            pauta: 'Revisão das metas de transição para Tech Lead e feedbacks do último sprint.',
        },
        {
            id: '2',
            titulo: '1:1 Quinzena de Acompanhamento',
            dataHora: '20/07/2026 às 15:30',
            status: 'Realizada',
            participante: 'Diego Rocha (Gestor)',
            pauta: 'Definição dos cursos de capacitação e alinhamento do PDI.',
        },
    ]);

    return (
        <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '40px', fontFamily: "'Inter', sans-serif" }}>

            {/* ── CABEÇALHO DA PÁGINA (PADRÃO CAPACITAÇÃO & TRILHA) ───────────────── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '28px'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: theme.text,
                        letterSpacing: '-0.02em',
                        margin: '0 0 4px 0',
                        transition: 'color 0.3s ease'
                    }}>
                        Reuniões 1:1 — Ana Lima
                    </h1>
                    <p style={{ margin: 0, color: theme.textSecondary, fontSize: '0.875rem', transition: 'color 0.3s ease' }}>
                        Histórico e agendamentos de conversas individuais.
                    </p>
                </div>

                <button
                    style={{
                        backgroundColor: theme.accent,
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '10px',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        boxShadow: `0 2px 8px ${theme.mode === 'dark' ? 'rgba(96, 165, 250, 0.25)' : 'rgba(99, 102, 241, 0.25)'}`,
                        transition: 'all 0.2s ease'
                    }}
                >
                    <IconPlus /> Agendar 1:1
                </button>
            </div>

            {/* ── LISTA DE REUNIÕES ────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reunioes.map((item) => {
                    const isAgendada = item.status === 'Agendada';
                    return (
                        <div
                            key={item.id}
                            style={{
                                backgroundColor: theme.cardBackground,
                                borderRadius: '16px',
                                border: `1px solid ${theme.cardBorder}`,
                                padding: '20px 24px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                                display: 'flex',
                                gap: '18px',
                                alignItems: 'flex-start',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {/* ÍCONE */}
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                backgroundColor: isAgendada ? theme.mode === 'dark' ? '#3730A3' : '#EEF2FF' : theme.mode === 'dark' ? '#1E293B' : '#F1F5F9',
                                color: isAgendada ? theme.accent : theme.textTertiary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'all 0.3s ease'
                            }}>
                                <IconCalendar />
                            </div>

                            {/* CONTEÚDO */}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            padding: '3px 10px',
                                            borderRadius: '20px',
                                            backgroundColor: isAgendada ? theme.mode === 'dark' ? '#3730A3' : '#EEF2FF' : theme.mode === 'dark' ? '#1E293B' : '#F1F5F9',
                                            color: isAgendada ? theme.accent : theme.textSecondary,
                                            transition: 'all 0.3s ease'
                                        }}>
                                            {item.status}
                                        </span>
                                        <span style={{ fontSize: '0.825rem', color: theme.textSecondary, fontWeight: 500, transition: 'color 0.3s ease' }}>
                                            {item.dataHora}
                                        </span>
                                    </div>

                                    <span style={{ fontSize: '0.825rem', color: theme.textSecondary, fontWeight: 500, transition: 'color 0.3s ease' }}>
                                        {item.participante}
                                    </span>
                                </div>

                                <h3 style={{
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    color: theme.text,
                                    margin: '0 0 6px 0',
                                    letterSpacing: '-0.01em',
                                    transition: 'color 0.3s ease'
                                }}>
                                    {item.titulo}
                                </h3>

                                <p style={{ margin: 0, fontSize: '0.875rem', color: theme.textSecondary, lineHeight: '1.5', transition: 'color 0.3s ease' }}>
                                    <strong style={{ fontWeight: 600, color: theme.text }}>Pauta:</strong> {item.pauta}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
}