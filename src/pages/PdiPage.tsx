import { useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

type MetaStatus = 'Em andamento' | 'Concluída' | 'Bloqueada';
type PdiStatus = 'Em aprovação' | 'Rascunho' | 'Aprovado';

interface Meta {
    id: string;
    objetivo: string;
    descricao: string;
    competencias: string[];
    acoes: string;
    evidencias: string;
    prazo: string;
    progresso: number;
    status: MetaStatus;
}

interface Pdi {
    id: string;
    titulo: string;
    periodo: string;
    status: PdiStatus;
    colaborador: string;
    cargo: string;
    iniciais: string;
    aberto: boolean;
    metas: Meta[];
}

const IconPlus = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const IconChevronDown = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const IconChevronUp = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
    </svg>
);

const IconTrash = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
);

const initialPdis: Pdi[] = [
    {
        id: 'pdi-1',
        titulo: 'Crescimento técnico em arquitetura',
        periodo: '2026 S1',
        status: 'Em aprovação',
        colaborador: 'Ana Souza',
        cargo: 'Desenvolvedora Pleno',
        iniciais: 'AS',
        aberto: true,
        metas: [
            {
                id: 'meta-1',
                objetivo: 'Concluir curso de System Design',
                descricao: '40h de estudo aplicado',
                competencias: ['Arquitetura'],
                acoes: 'Estudar 4h/semana e aplicar em projeto interno.',
                evidencias: 'Certificado + ADR publicado.',
                prazo: '30/08/2026',
                progresso: 75,
                status: 'Em andamento',
            },
            {
                id: 'meta-2',
                objetivo: 'Liderar refatoração do módulo Auth',
                descricao: 'Apresentar arquitetura proposta',
                competencias: ['Liderança', 'Arquitetura'],
                acoes: 'Levantar requisitos, RFC, code review.',
                evidencias: 'RFC aprovado em time review.',
                prazo: '15/07/2026',
                progresso: 30,
                status: 'Em andamento',
            },
        ],
    },
];

const emptyForm = {
    titulo: '',
    periodo: '2026 S2',
    objetivo: '',
    competencias: '',
    acoes: '',
    evidencias: '',
};

interface PdiPageProps {
    nomeUsuario?: string;
    perfil?: string;
}

export default function PdiPage({ nomeUsuario = 'Ana Souza' }: PdiPageProps) {
    const { theme } = useTheme();
    const [pdis, setPdis] = useState<Pdi[]>(initialPdis);
    const [modalAberto, setModalAberto] = useState(false);
    const [form, setForm] = useState(emptyForm);

    const totalPdis = pdis.length;
    const metasAtivas = useMemo(
        () => pdis.flatMap((pdi) => pdi.metas).filter((meta) => meta.status !== 'Concluída').length,
        [pdis]
    );

    const calcularProgressoPdi = (pdi: Pdi) => {
        if (pdi.metas.length === 0) return 0;
        return Math.round(pdi.metas.reduce((sum, meta) => sum + meta.progresso, 0) / pdi.metas.length);
    };

    const atualizarPdi = (pdiId: string, updater: (pdi: Pdi) => Pdi) => {
        setPdis((prev) => prev.map((pdi) => (pdi.id === pdiId ? updater(pdi) : pdi)));
    };

    const atualizarMeta = (pdiId: string, metaId: string, changes: Partial<Meta>) => {
        atualizarPdi(pdiId, (pdi) => ({
            ...pdi,
            metas: pdi.metas.map((meta) => (meta.id === metaId ? { ...meta, ...changes } : meta)),
        }));
    };

    const removerPdi = (pdiId: string) => {
        setPdis((prev) => prev.filter((pdi) => pdi.id !== pdiId));
    };

    const removerMeta = (pdiId: string, metaId: string) => {
        atualizarPdi(pdiId, (pdi) => ({
            ...pdi,
            metas: pdi.metas.filter((meta) => meta.id !== metaId),
        }));
    };

    const criarPdi = () => {
        const competencias = form.competencias
            .split(',')
            .map((competencia) => competencia.trim())
            .filter(Boolean);

        const novoPdi: Pdi = {
            id: `pdi-${Date.now()}`,
            titulo: form.titulo.trim() || 'Novo PDI em rascunho',
            periodo: form.periodo.trim() || '2026 S2',
            status: 'Rascunho',
            colaborador: nomeUsuario,
            cargo: 'Desenvolvedora Pleno',
            iniciais: nomeUsuario.split(' ').map((parte) => parte[0]).join('').substring(0, 2).toUpperCase(),
            aberto: true,
            metas: [
                {
                    id: `meta-${Date.now()}`,
                    objetivo: form.objetivo.trim() || 'Primeira meta do PDI',
                    descricao: 'Meta criada como rascunho',
                    competencias: competencias.length > 0 ? competencias : ['Desenvolvimento'],
                    acoes: form.acoes.trim() || 'Definir ações necessárias com o gestor.',
                    evidencias: form.evidencias.trim() || 'Definir evidências de conclusão.',
                    prazo: 'A definir',
                    progresso: 0,
                    status: 'Em andamento',
                },
            ],
        };

        setPdis((prev) => [novoPdi, ...prev]);
        setForm(emptyForm);
        setModalAberto(false);
    };

    const inputStyle = {
        width: '100%',
        borderRadius: 10,
        border: `1px solid ${theme.inputBorder}`,
        backgroundColor: theme.inputBackground,
        color: theme.text,
        padding: '12px 14px',
        fontSize: '0.95rem',
        outline: 'none',
        boxShadow: 'none',
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40, fontFamily: "'Inter', sans-serif" }}>
            <style>{`
                .pdi-range {
                    appearance: none;
                    width: 100%;
                    height: 8px;
                    border-radius: 999px;
                    background: transparent;
                    cursor: pointer;
                }
                .pdi-range::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: ${theme.cardBackground};
                    border: 1px solid ${theme.accent};
                    box-shadow: 0 1px 4px rgba(15, 131, 200, 0.25);
                    margin-top: -6px;
                }
                .pdi-range::-webkit-slider-runnable-track {
                    height: 8px;
                    border-radius: 999px;
                }
                .pdi-range::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: ${theme.cardBackground};
                    border: 1px solid ${theme.accent};
                    box-shadow: 0 1px 4px rgba(15, 131, 200, 0.25);
                }
            `}</style>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
                    <button
                        onClick={() => setModalAberto(true)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '11px 16px',
                            borderRadius: 12,
                            border: 'none',
                            backgroundColor: theme.accent,
                            color: '#FFFFFF',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            boxShadow: `0 2px 8px ${theme.accent}33`,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <IconPlus /> Novo PDI
                    </button>

                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: theme.text, margin: '0 0 4px 0' }}>
                            Planos de Desenvolvimento Individual
                        </h1>
                        <p style={{ color: theme.textSecondary, fontSize: '0.875rem', margin: 0 }}>
                            Crie, revise e acompanhe metas com progresso, status e evidências.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ padding: '10px 14px', borderRadius: 12, border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.cardBackground, color: theme.text }}>
                        <strong>{totalPdis}</strong> PDI
                    </div>
                    <div style={{ padding: '10px 14px', borderRadius: 12, border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.cardBackground, color: theme.text }}>
                        <strong>{metasAtivas}</strong> metas ativas
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {pdis.map((pdi) => {
                    const progressoPdi = calcularProgressoPdi(pdi);
                    return (
                        <article key={pdi.id} style={{
                            backgroundColor: theme.cardBackground,
                            border: `1px solid ${theme.cardBorder}`,
                            borderRadius: 16,
                            padding: '24px 26px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                                <div style={{ display: 'flex', gap: 20 }}>
                                    <div style={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: '50%',
                                        backgroundColor: '#FB923C',
                                        color: '#FFFFFF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        flexShrink: 0,
                                    }}>
                                        {pdi.iniciais}
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                                            <h2 style={{ color: theme.text, fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                                                {pdi.titulo}
                                            </h2>
                                            <span style={{
                                                border: `1px solid ${theme.accentLight}`,
                                                backgroundColor: theme.backgroundSecondary,
                                                color: theme.text,
                                                borderRadius: 999,
                                                padding: '4px 12px',
                                                fontSize: '0.8rem',
                                                fontWeight: 700,
                                            }}>
                                                {pdi.status}
                                            </span>
                                            <span style={{ color: theme.textSecondary, fontSize: '0.85rem' }}>· {pdi.periodo}</span>
                                        </div>
                                        <p style={{ color: theme.textSecondary, margin: 0, fontSize: '0.95rem' }}>
                                            {pdi.colaborador} · {pdi.cargo}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => atualizarPdi(pdi.id, (atual) => ({ ...atual, aberto: !atual.aberto }))}
                                    title={pdi.aberto ? 'Recolher PDI' : 'Expandir PDI'}
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 10,
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        color: theme.text,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {pdi.aberto ? <IconChevronUp /> : <IconChevronDown />}
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 22 }}>
                                <div style={{ flex: 1, height: 10, borderRadius: 999, backgroundColor: theme.backgroundSecondary, overflow: 'hidden' }}>
                                    <div style={{ width: `${progressoPdi}%`, height: '100%', backgroundColor: theme.accent, borderRadius: 999 }} />
                                </div>
                                <span style={{ color: theme.text, fontWeight: 700, minWidth: 44, textAlign: 'right' }}>{progressoPdi}%</span>
                            </div>

                            {pdi.aberto && (
                                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {pdi.metas.map((meta) => (
                                        <section key={meta.id} style={{
                                            border: `1px solid ${theme.cardBorder}`,
                                            backgroundColor: theme.background,
                                            borderRadius: 14,
                                            padding: '18px 16px',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 12 }}>
                                                <div>
                                                    <h3 style={{ color: theme.text, fontSize: '1rem', fontWeight: 700, margin: '0 0 4px 0' }}>
                                                        {meta.objetivo}
                                                    </h3>
                                                    <p style={{ color: theme.textSecondary, margin: 0, fontSize: '0.875rem' }}>{meta.descricao}</p>
                                                </div>
                                                <span style={{
                                                    border: `1px solid ${theme.accentLight}`,
                                                    backgroundColor: theme.inputBackground,
                                                    borderRadius: 999,
                                                    color: theme.text,
                                                    padding: '4px 12px',
                                                    fontSize: '0.82rem',
                                                    fontWeight: 700,
                                                }}>
                                                    {meta.status}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                                                {meta.competencias.map((competencia) => (
                                                    <span key={competencia} style={{
                                                        backgroundColor: '#FEF3C7',
                                                        color: theme.text,
                                                        borderRadius: 999,
                                                        padding: '6px 12px',
                                                        fontSize: '0.82rem',
                                                        fontWeight: 600,
                                                    }}>
                                                        {competencia}
                                                    </span>
                                                ))}
                                            </div>

                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr',
                                                gap: 24,
                                                color: theme.textSecondary,
                                                fontSize: '0.875rem',
                                                lineHeight: 1.45,
                                                marginBottom: 18,
                                            }}>
                                                <div><strong style={{ color: theme.text }}>Ações:</strong> {meta.acoes}</div>
                                                <div><strong style={{ color: theme.text }}>Evidências:</strong> {meta.evidencias}</div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto minmax(180px, 1fr) minmax(150px, 180px) auto', alignItems: 'center', gap: 12 }}>
                                                <span style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>Prazo: {meta.prazo}</span>
                                                <span style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>Progresso {meta.progresso}%</span>
                                                <input
                                                    className="pdi-range"
                                                    type="range"
                                                    min={0}
                                                    max={100}
                                                    value={meta.progresso}
                                                    onChange={(event) => atualizarMeta(pdi.id, meta.id, { progresso: Number(event.target.value) })}
                                                    style={{
                                                        background: `linear-gradient(to right, ${theme.accent} 0%, ${theme.accent} ${meta.progresso}%, ${theme.backgroundSecondary} ${meta.progresso}%, ${theme.backgroundSecondary} 100%)`,
                                                    }}
                                                    aria-label={`Progresso de ${meta.objetivo}`}
                                                />
                                                <select
                                                    value={meta.status}
                                                    onChange={(event) => atualizarMeta(pdi.id, meta.id, { status: event.target.value as MetaStatus })}
                                                    style={{
                                                        border: `1px solid ${theme.cardBorder}`,
                                                        borderRadius: 12,
                                                        backgroundColor: theme.inputBackground,
                                                        color: theme.text,
                                                        padding: '9px 12px',
                                                        fontWeight: 600,
                                                        outline: 'none',
                                                        boxShadow: 'none',
                                                    }}
                                                >
                                                    <option>Em andamento</option>
                                                    <option>Concluída</option>
                                                    <option>Bloqueada</option>
                                                </select>
                                                <button
                                                    onClick={() => removerMeta(pdi.id, meta.id)}
                                                    title="Excluir meta"
                                                    style={{
                                                        width: 36,
                                                        height: 36,
                                                        border: 'none',
                                                        backgroundColor: 'transparent',
                                                        color: theme.text,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <IconTrash />
                                                </button>
                                            </div>
                                        </section>
                                    ))}

                                    <button
                                        onClick={() => removerPdi(pdi.id)}
                                        title="Excluir PDI"
                                        style={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: 10,
                                            border: 'none',
                                            backgroundColor: 'transparent',
                                            color: theme.text,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <IconTrash />
                                    </button>
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>

            {modalAberto && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 100,
                    backgroundColor: 'rgba(0, 0, 0, 0.72)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 24,
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: 640,
                        borderRadius: 14,
                        backgroundColor: theme.background,
                        border: `1px solid ${theme.cardBorder}`,
                        boxShadow: '0 10px 24px rgba(0, 0, 0, 0.16)',
                        padding: '28px 30px 30px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ color: theme.text, fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Novo PDI</h2>
                            <button
                                onClick={() => setModalAberto(false)}
                                style={{
                                    width: 34,
                                    height: 34,
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: theme.textSecondary,
                                    cursor: 'pointer',
                                    fontSize: '1.7rem',
                                    lineHeight: 1,
                                }}
                                aria-label="Fechar modal"
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14, marginBottom: 22 }}>
                            <label style={{ color: theme.text, fontWeight: 600 }}>
                                Título
                                <input
                                    autoFocus
                                    value={form.titulo}
                                    onChange={(event) => setForm((prev) => ({ ...prev, titulo: event.target.value }))}
                                    style={{ ...inputStyle, marginTop: 6 }}
                                />
                            </label>
                            <label style={{ color: theme.text, fontWeight: 600 }}>
                                Período
                                <input
                                    value={form.periodo}
                                    onChange={(event) => setForm((prev) => ({ ...prev, periodo: event.target.value }))}
                                    style={{ ...inputStyle, marginTop: 6 }}
                                />
                            </label>
                        </div>

                        <div style={{ color: theme.textSecondary, fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18 }}>
                            Primeira meta
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <label style={{ color: theme.text, fontWeight: 600 }}>
                                Objetivo
                                <input
                                    value={form.objetivo}
                                    onChange={(event) => setForm((prev) => ({ ...prev, objetivo: event.target.value }))}
                                    placeholder="O que você quer alcançar?"
                                    style={{ ...inputStyle, marginTop: 6 }}
                                />
                            </label>
                            <label style={{ color: theme.text, fontWeight: 600 }}>
                                Competências relacionadas (separadas por vírgula)
                                <input
                                    value={form.competencias}
                                    onChange={(event) => setForm((prev) => ({ ...prev, competencias: event.target.value }))}
                                    placeholder="Ex.: Arquitetura, Liderança"
                                    style={{ ...inputStyle, marginTop: 6 }}
                                />
                            </label>
                            <label style={{ color: theme.text, fontWeight: 600 }}>
                                Ações necessárias
                                <textarea
                                    value={form.acoes}
                                    onChange={(event) => setForm((prev) => ({ ...prev, acoes: event.target.value }))}
                                    style={{ ...inputStyle, minHeight: 76, resize: 'vertical', marginTop: 6 }}
                                />
                            </label>
                            <label style={{ color: theme.text, fontWeight: 600 }}>
                                Evidências
                                <textarea
                                    value={form.evidencias}
                                    onChange={(event) => setForm((prev) => ({ ...prev, evidencias: event.target.value }))}
                                    placeholder="Como vamos comprovar a evolução?"
                                    style={{ ...inputStyle, minHeight: 76, resize: 'vertical', marginTop: 6 }}
                                />
                            </label>
                        </div>

                        <p style={{ color: theme.textSecondary, fontSize: '0.875rem', margin: '16px 0 22px' }}>
                            O prazo será definido pelo seu gestor na revisão.
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button
                                onClick={() => {
                                    setForm(emptyForm);
                                    setModalAberto(false);
                                }}
                                style={{
                                    padding: '12px 20px',
                                    borderRadius: 12,
                                    border: `1px solid ${theme.cardBorder}`,
                                    backgroundColor: theme.inputBackground,
                                    color: theme.text,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: 'none',
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={criarPdi}
                                style={{
                                    padding: '12px 20px',
                                    borderRadius: 12,
                                    border: 'none',
                                    backgroundColor: theme.accent,
                                    color: '#FFFFFF',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: `0 2px 8px ${theme.accent}33`,
                                }}
                            >
                                Criar como rascunho
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
