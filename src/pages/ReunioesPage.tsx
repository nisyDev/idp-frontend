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

const IconTeams = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21v-4" />
        <path d="M16 21v-4" />
    </svg>
);

interface Meeting {
    id: string;
    titulo: string;
    dataHora: string;
    status: 'Agendada' | 'Realizada';
    participante: string;
    pauta: string;
    teamsLink?: string;
}

interface ReunioesPageProps {
    nomeUsuario?: string;
    perfil?: string;
}

export default function ReunioesPage({ nomeUsuario = 'Ana Lima', perfil = 'COLABORADOR' }: ReunioesPageProps) {
    const canCreate = perfil && perfil.toString().toUpperCase().includes('GESTOR');
    const { theme } = useTheme();
    const [reunioes, setReunioes] = useState<Meeting[]>([
        {
            id: '1',
            titulo: '1:1 de Alinhamento Trimestral de Carreira',
            dataHora: '05/08/2026 às 14:00',
            status: 'Agendada',
            participante: 'Diego Rocha (Gestor)',
            pauta: 'Revisão das metas de transição para Tech Lead e feedbacks do último sprint.',
            teamsLink: 'https://teams.microsoft.com/simulacao/1'
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

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        tipo: '1:1',
        participante: 'Diego Rocha (Gestor)',
        data: '',
        hora: '',
        pauta: '',
        criarLinkTeams: true,
    });

    const abrirModal = () => setShowModal(true);
    const fecharModal = () => {
        setShowModal(false);
        setForm({ tipo: '1:1', participante: 'Diego Rocha (Gestor)', data: '', hora: '', pauta: '', criarLinkTeams: true });
    };

    const handleAgendar = () => {
        const id = String(Date.now());
        const dataHora = form.data && form.hora ? `${form.data} às ${form.hora}` : 'A definir';
        const nova: Meeting = {
            id,
            titulo: `${form.tipo} — ${form.participante}`,
            dataHora,
            status: 'Agendada',
            participante: form.participante,
            pauta: form.pauta,
            teamsLink: form.criarLinkTeams ? `https://teams.microsoft.com/simulacao/${id}` : undefined,
        };
        setReunioes(prev => [nova, ...prev]);
        fecharModal();
    };

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
                        Reuniões 1:1 — {nomeUsuario}
                    </h1>
                    <p style={{ margin: 0, color: theme.textSecondary, fontSize: '0.875rem', transition: 'color 0.3s ease' }}>
                        Histórico e agendamentos de conversas individuais.
                    </p>
                </div>

                {canCreate ? (
                    <button
                        onClick={abrirModal}
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
                            boxShadow: `0 2px 8px ${theme.accent}40`,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <IconPlus /> Agendar 1:1
                    </button>
                ) : (
                    <div style={{ color: theme.textSecondary, fontSize: '0.9rem', fontWeight: 600 }}>
                        Apenas gestores podem agendar 1:1
                    </div>
                )}
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
                                backgroundColor: isAgendada ? `${theme.accentLight}4D` : theme.backgroundSecondary,
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
                                            backgroundColor: isAgendada ? `${theme.accentLight}4D` : theme.backgroundSecondary,
                                            color: isAgendada ? theme.accent : theme.textSecondary,
                                            transition: 'all 0.3s ease'
                                        }}>
                                            {item.status}
                                        </span>
                                        <span style={{ fontSize: '0.825rem', color: theme.textSecondary, fontWeight: 500, transition: 'color 0.3s ease' }}>
                                            {item.dataHora}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: '0.825rem', color: theme.textSecondary, fontWeight: 500, transition: 'color 0.3s ease' }}>{item.participante}</span>
                                        {item.teamsLink && (
                                            <a href={item.teamsLink} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginLeft: 8, color: theme.accent, textDecoration: 'none', fontWeight: 600 }}>
                                                <IconTeams /> Link Teams
                                            </a>
                                        )}
                                    </div>
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

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
                    <div style={{ width: 680, borderRadius: 12, backgroundColor: theme.cardBackground, padding: 24, border: `1px solid ${theme.cardBorder}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <h3 style={{ margin: 0, color: theme.text }}>Nova reunião</h3>
                            <button onClick={fecharModal} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>×</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '0.9rem', color: theme.textSecondary }}>Tipo</label>
                                <select value={form.tipo} onChange={(e) => setForm(f => ({ ...f, tipo: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${theme.inputBorder}`, backgroundColor: theme.inputBackground }}>
                                    <option>1:1</option>
                                    <option>Reunião</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.9rem', color: theme.textSecondary }}>Com gestor(a)</label>
                                <select value={form.participante} onChange={(e) => setForm(f => ({ ...f, participante: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${theme.inputBorder}`, backgroundColor: theme.inputBackground }}>
                                    <option>Diego Rocha (Gestor)</option>
                                    <option>Bruno Lima</option>
                                    <option>Gustavo Alves</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.9rem', color: theme.textSecondary }}>Data</label>
                                <input value={form.data} onChange={(e) => setForm(f => ({ ...f, data: e.target.value }))} placeholder="dd/mm/aaaa" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${theme.inputBorder}`, backgroundColor: theme.inputBackground }} />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.9rem', color: theme.textSecondary }}>Hora</label>
                                <input value={form.hora} onChange={(e) => setForm(f => ({ ...f, hora: e.target.value }))} placeholder="14:00" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${theme.inputBorder}`, backgroundColor: theme.inputBackground }} />
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '0.9rem', color: theme.textSecondary }}>Pauta</label>
                                <textarea value={form.pauta} onChange={(e) => setForm(f => ({ ...f, pauta: e.target.value }))} style={{ width: '100%', minHeight: 100, padding: '10px 12px', borderRadius: 8, border: `1px solid ${theme.inputBorder}`, backgroundColor: theme.inputBackground }} />
                            </div>
                        </div>

                        <div style={{ marginTop: 12, borderRadius: 8, border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.backgroundSecondary, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ flexShrink: 0 }}>
                                <IconTeams />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: theme.text }}>Microsoft Teams</div>
                                <div style={{ color: theme.textSecondary, fontSize: '0.9rem' }}>Um link de reunião será criado automaticamente.</div>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input type="checkbox" checked={form.criarLinkTeams} onChange={(e) => setForm(f => ({ ...f, criarLinkTeams: e.target.checked }))} />
                                <span style={{ color: theme.textSecondary }}>Criar link</span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                            <button onClick={fecharModal} style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: theme.cardBackground, border: `1px solid ${theme.cardBorder}` }}>Cancelar</button>
                            <button onClick={handleAgendar} style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: theme.accent, color: '#fff', border: 'none' }}>Agendar</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
