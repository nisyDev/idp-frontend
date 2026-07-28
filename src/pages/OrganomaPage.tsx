import { useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import EditableField from '../components/EditableField';

interface OrganomaPageProps {
    nomeUsuario?: string;
    perfil?: string;
}

interface Member {
    id: string;
    nome: string;
    cargo: string;
}

interface Department {
    id: string;
    nome: string;
    membros: Member[];
}

interface AbaData {
    chefe: string;
    departamentos: Department[];
}

const abasData: Record<string, AbaData> = {
    'PS e Cloud': {
        chefe: 'Bruno Lima',
        departamentos: [
            {
                id: '1',
                nome: 'Engenharia',
                membros: [
                    { id: '1-1', nome: 'Ana Souza', cargo: 'Dev Front-end' },
                    { id: '1-2', nome: 'Felipe Castro', cargo: 'Dev Senior' },
                    { id: '1-3', nome: 'Marcos Alves', cargo: 'Dev Back-end' },
                    { id: '1-4', nome: 'Lucas Pereira', cargo: 'Dev Junior' }
                ]
            },
            {
                id: '2',
                nome: 'Canal e Infra',
                membros: [
                    { id: '2-1', nome: 'Rafael Nunes', cargo: 'Cloud Engineer' },
                    { id: '2-2', nome: 'Juliana Reis', cargo: 'DevOps' },
                    { id: '2-3', nome: 'Gustavo Costa', cargo: 'SRE' }
                ]
            },
            {
                id: '3',
                nome: 'Produtos',
                membros: [
                    { id: '3-1', nome: 'Diego Rocha', cargo: 'Gestor' },
                    { id: '3-2', nome: 'Elisa Paulo', cargo: 'Analista de Dados' },
                    { id: '3-3', nome: 'Fernanda Silva', cargo: 'Especialista PO' }
                ]
            }
        ]
    },
    'Outsourcing': {
        chefe: 'Carlos Mendes',
        departamentos: [
            {
                id: '1',
                nome: 'Desenvolvimento',
                membros: [
                    { id: '1-1', nome: 'João Santos', cargo: 'Dev Full Stack' },
                    { id: '1-2', nome: 'Maria Oliveira', cargo: 'QA Engineer' },
                    { id: '1-3', nome: 'Pedro Lima', cargo: 'Dev Back-end' }
                ]
            },
            {
                id: '2',
                nome: 'Suporte',
                membros: [
                    { id: '2-1', nome: 'Patricia Costa', cargo: 'Tech Support' },
                    { id: '2-2', nome: 'Roberto Alves', cargo: 'L2 Support' }
                ]
            },
            {
                id: '3',
                nome: 'Projetos',
                membros: [
                    { id: '3-1', nome: 'Beatriz Dias', cargo: 'Project Manager' },
                    { id: '3-2', nome: 'André Ferreira', cargo: 'Coordenador' }
                ]
            }
        ]
    },
    'Estagiários': {
        chefe: 'Vanessa Ribeiro',
        departamentos: [
            {
                id: '1',
                nome: 'Desenvolvimento',
                membros: [
                    { id: '1-1', nome: 'Thiago Martins', cargo: 'Estagiário Front' },
                    { id: '1-2', nome: 'Isabela Gomes', cargo: 'Estagiária Back' },
                    { id: '1-3', nome: 'Bruno Castro', cargo: 'Estagiário Full Stack' },
                    { id: '1-4', nome: 'Camila Rocha', cargo: 'Estagiária Front' }
                ]
            },
            {
                id: '2',
                nome: 'Testes & QA',
                membros: [
                    { id: '2-1', nome: 'Felipe Neves', cargo: 'Estagiário QA' },
                    { id: '2-2', nome: 'Larissa Marques', cargo: 'Estagiária Testes' }
                ]
            },
            {
                id: '3',
                nome: 'Infraestrutura',
                membros: [
                    { id: '3-1', nome: 'Rodrigo Peixoto', cargo: 'Estagiário DevOps' },
                    { id: '3-2', nome: 'Alice Mendes', cargo: 'Estagiária Infra' }
                ]
            }
        ]
    }
};

export default function OrganomaPage({ nomeUsuario = 'Ana Lima', perfil = 'COLABORADOR' }: OrganomaPageProps) {
    const { theme } = useTheme();
    const [abaSelecionada, setAbaSelecionada] = useState<keyof typeof abasData>('PS e Cloud');
    const [zoom, setZoom] = useState(100);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [departamentos, setDepartamentos] = useState<Department[]>(abasData[abaSelecionada].departamentos);
    const abaAtual = abasData[abaSelecionada];

    const canEdit = perfil === 'RH' || perfil === 'GESTOR';

    const handleAbaChange = (aba: keyof typeof abasData) => {
        setAbaSelecionada(aba);
        setDepartamentos(abasData[aba].departamentos);
        setZoom(100);
        setOffset({ x: 0, y: 0 });
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
    const handleResetZoom = () => {
        setZoom(100);
        setOffset({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button, input, textarea, [contenteditable]')) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleUpdateDepartamento = (deptId: string, newName: string) => {
        if (!canEdit) return;
        setDepartamentos(prev =>
            prev.map(dept =>
                dept.id === deptId ? { ...dept, nome: newName } : dept
            )
        );
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>

            {/* ── CABEÇALHO PADRONIZADO ────────────────────────────────────────── */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: theme.text,
                    letterSpacing: '-0.02em',
                    margin: 0,
                    marginBottom: '8px',
                    transition: 'color 0.3s ease'
                }}>
                    Organograma
                </h1>
                <p style={{ margin: 0, color: theme.textSecondary, fontSize: '0.875rem', transition: 'color 0.3s ease' }}>
                    Estrutura por área. Arraste para mover, use a roda do mouse ou os botões para dar zoom. {canEdit ? 'Você pode editar.' : 'Apenas RH e Gestor podem editar.'}
                </p>
            </div>

            {/* ── INFORMAÇÃO DE ATUALIZAÇÃO ──────────────────────────────────── */}
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: `${theme.accent}1A`,
                color: theme.accent,
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '24px',
                transition: 'all 0.3s ease'
            }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Atualizado em 01/06/2026, 10:00
            </div>

            {/* ── ABAS DE DEPARTAMENTOS ──────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
                {Object.keys(abasData).map((aba) => (
                    <button
                        key={aba}
                        onClick={() => handleAbaChange(aba as keyof typeof abasData)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            backgroundColor: abaSelecionada === aba ? theme.accent : theme.backgroundSecondary,
                            color: abaSelecionada === aba ? '#FFFFFF' : theme.textSecondary,
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 200ms ease-out'
                        }}
                    >
                        {aba}
                    </button>
                ))}
            </div>

            {/* ── CONTAINER DO ORGANOGRAMA COM ZOOM E DRAG ──────────────────── */}
            <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    backgroundColor: theme.cardBackground,
                    border: `1px solid ${theme.cardBorder}`,
                    borderRadius: '16px',
                    padding: '32px',
                    minHeight: '500px',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    transition: 'background-color 0.3s ease'
                }}
            >

                {/* Dica de movimento */}
                <div style={{
                    position: 'absolute',
                    top: '32px',
                    left: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.875rem',
                    color: theme.textSecondary,
                    pointerEvents: 'none',
                    transition: 'color 0.3s ease'
                }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 9l-3 3m0 0l3 3m-3-3h12a4 4 0 010 8h-4"/>
                    </svg>
                    arraste para mover | zoom: {zoom}%
                </div>

                {/* Controles de zoom (superior direito) */}
                <div style={{
                    position: 'absolute',
                    top: '32px',
                    right: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    pointerEvents: 'auto'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={handleZoomOut}
                            style={{
                                background: theme.backgroundSecondary,
                                border: `1px solid ${theme.cardBorder}`,
                                borderRadius: '6px',
                                width: '32px',
                                height: '32px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: theme.textSecondary,
                                fontSize: '1.2rem',
                                transition: 'all 200ms ease-out'
                            }}
                            title="Zoom out"
                        >
                            −
                        </button>
                        <span style={{
                            fontSize: '0.875rem',
                            color: theme.textSecondary,
                            minWidth: '50px',
                            textAlign: 'center',
                            transition: 'color 0.3s ease'
                        }}>
                            {zoom}%
                        </span>
                        <button
                            onClick={handleZoomIn}
                            style={{
                                background: theme.backgroundSecondary,
                                border: `1px solid ${theme.cardBorder}`,
                                borderRadius: '6px',
                                width: '32px',
                                height: '32px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: theme.textSecondary,
                                fontSize: '1.2rem',
                                transition: 'all 200ms ease-out'
                            }}
                            title="Zoom in"
                        >
                            +
                        </button>
                    </div>
                    <button
                        onClick={handleResetZoom}
                        style={{
                            background: `${theme.accent}1A`,
                            border: `1px solid ${theme.accentLight}40`,
                            borderRadius: '6px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            color: theme.accent,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            transition: 'all 200ms ease-out'
                        }}
                        title="Reset zoom"
                    >
                        Reset
                    </button>
                </div>

                {/* ── ESTRUTURA ORGANOGRAMA COM ZOOM E TRANSFORMAÇÃO ─────────────── */}
                <div style={{
                    transform: `scale(${zoom / 100}) translate(${offset.x / (zoom / 100)}px, ${offset.y / (zoom / 100)}px)`,
                    transformOrigin: 'center top',
                    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>

                    {/* CEO / Head */}
                    <div style={{
                        backgroundColor: theme.backgroundSecondary,
                        border: `2px solid ${theme.accent}`,
                        borderRadius: '12px',
                        padding: '16px 24px',
                        marginBottom: '48px',
                        textAlign: 'center',
                        minWidth: '200px',
                        transition: 'background-color 0.3s ease'
                    }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: theme.textSecondary, marginBottom: '4px', transition: 'color 0.3s ease' }}>Head da Área</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: theme.text, transition: 'color 0.3s ease' }}>{abaAtual.chefe}</div>
                    </div>

                    {/* Linha vertical */}
                    <div style={{
                        width: '2px',
                        height: '40px',
                        backgroundColor: theme.cardBorder,
                        transition: 'background-color 0.3s ease'
                    }} />

                    {/* Linha horizontal */}
                    <div style={{
                        width: '100%',
                        height: '2px',
                        backgroundColor: theme.cardBorder,
                        marginBottom: '40px',
                        transition: 'background-color 0.3s ease'
                    }} />

                    {/* Departamentos */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${Math.min(departamentos.length, 3)}, 1fr)`,
                        gap: '32px',
                        width: '100%',
                        minWidth: '900px'
                    }}>
                        {departamentos.map((dept) => (
                            <div key={dept.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {/* Linha vertical do dept */}
                                <div style={{
                                    width: '2px',
                                    height: '40px',
                                    backgroundColor: theme.cardBorder,
                                    marginBottom: '20px',
                                    transition: 'background-color 0.3s ease'
                                }} />

                                {/* Card do departamento */}
                                <div style={{
                                    backgroundColor: theme.cardBackground,
                                    border: `1px solid ${theme.cardBorder}`,
                                    borderRadius: '12px',
                                    padding: '16px',
                                    minWidth: '240px',
                                    transition: 'background-color 0.3s ease'
                                }}>
                                    {/* Nome do departamento (editável para RH) */}
                                    <div style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: theme.accent,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        marginBottom: '8px',
                                        textAlign: 'center',
                                        transition: 'color 0.3s ease'
                                    }}>
                                        {canEdit ? (
                                            <EditableField
                                                value={dept.nome}
                                                onChange={(value) => handleUpdateDepartamento(dept.id, value)}
                                                variant="span"
                                                style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    color: theme.accent,
                                                    textTransform: 'uppercase',
                                                    transition: 'color 0.3s ease'
                                                }}
                                            />
                                        ) : (
                                            dept.nome
                                        )}
                                    </div>

                                    {/* Membros */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {dept.membros.map((membro, idx) => (
                                            <div
                                                key={membro.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    paddingTop: idx > 0 ? '12px' : '0',
                                                    borderTop: idx > 0 ? `1px solid ${theme.cardBorder}` : 'none',
                                                    transition: 'border-color 0.3s ease'
                                                }}
                                            >
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentLight})`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    color: '#FFFFFF',
                                                    flexShrink: 0,
                                                    transition: 'background 0.3s ease'
                                                }}>
                                                    {membro.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600,
                                                        color: theme.text,
                                                        transition: 'color 0.3s ease'
                                                    }}>
                                                        {membro.nome}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.75rem',
                                                        color: theme.textSecondary,
                                                        transition: 'color 0.3s ease'
                                                    }}>
                                                        {membro.cargo}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>

            </div>

        </div>
    );
}
