import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// ─── Ícones inline (Lucide-style SVG) ─────────────────────────────────────────
const IconSparkles = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/>
    </svg>
);
const IconCheckCircle = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
);
const IconExternalLink = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
);

export default function DesenvolvimentoPage({
                                                nomeUsuario = 'Ana Lima',
                                            }: {
    nomeUsuario?: string;
    perfil?: string;
}) {
    const { theme } = useTheme();
    const [conteudos, setConteudos] = useState([
        {
            id: 1,
            titulo: 'Arquitetura Front-end Avançada com Micro-Frontends',
            tipo: 'Curso',
            provedor: 'Pluralsight',
            duracao: '8 hrs',
            categoria: 'Hard Skill',
            concluido: true,
            recomendadoIA: true,
        },
        {
            id: 2,
            titulo: 'Liderança Técnica e Gestão de Conflitos em Times de Tecnologia',
            tipo: 'Treinamento Interno',
            provedor: 'BGP Academy',
            duracao: '4 hrs',
            categoria: 'Soft Skill',
            concluido: false,
            recomendadoIA: true,
        },
        {
            id: 3,
            titulo: 'O Gerente Eficaz (Peter Drucker)',
            tipo: 'Livro',
            provedor: 'Biblioteca BGP',
            duracao: '250 págs',
            categoria: 'Soft Skill',
            concluido: false,
            recomendadoIA: false,
        },
        {
            id: 4,
            titulo: 'Acessibilidade Web (WCAG 2.1) na Prática',
            tipo: 'Workshop',
            provedor: 'Alura',
            duracao: '6 hrs',
            categoria: 'Hard Skill',
            concluido: false,
            recomendadoIA: true,
        },
    ]);

    const toggleConcluido = (id: number) => {
        setConteudos(conteudos.map(item => item.id === id ? { ...item, concluido: !item.concluido } : item));
    };

    return (
        <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '40px', fontFamily: "'Inter', sans-serif" }}>

            {/* Header da Página */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: theme.text, margin: 0, marginBottom: 4, letterSpacing: '-0.02em', transition: 'color 0.3s ease' }}>
                    Trilha de Desenvolvimento & Capacitação
                </h1>
                <p style={{ color: theme.textSecondary, fontSize: '0.875rem', margin: 0, transition: 'color 0.3s ease' }}>
                    Recomendações de aprendizado alinhadas aos objetivos de carreira de {nomeUsuario}.
                </p>
            </div>

            {/* Banner TalentSynk Copilot / IA */}
            <div style={{
                background: `linear-gradient(135deg, ${theme.accentLight}15 0%, ${theme.accentLight}08 100%)`,
                borderRadius: 20,
                padding: '24px 28px',
                border: `1px solid ${theme.accentLight}40`,
                marginBottom: 32,
                display: 'flex',
                gap: 20,
                alignItems: 'flex-start',
                transition: 'background-color 0.3s ease'
            }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    backgroundColor: theme.accent, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, boxShadow: `0 4px 12px ${theme.accent}4D`,
                    transition: 'background-color 0.3s ease'
                }}>
                    <IconSparkles />
                </div>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: theme.accent, margin: 0, transition: 'color 0.3s ease' }}>
                            Sugestões da IA TalentSynk
                        </h3>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: theme.accent, backgroundColor: `${theme.accent}1A`, padding: '2px 8px', borderRadius: 999, transition: 'all 0.3s ease' }}>
                            IA Ativa
                        </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: theme.accent, lineHeight: 1.5, margin: 0, transition: 'color 0.3s ease' }}>
                        Com base no seu objetivo de avançar para <strong>Tech Lead</strong>, identificamos uma oportunidade de fortalecer sua habilidade em <strong>Liderança Técnica</strong>. Recomendamos priorizar o curso de <em>Gestão de Conflitos</em> antes da sua próxima 1:1 com <strong>Diego Rocha</strong>.
                    </p>
                </div>
            </div>

            {/* Lista de Conteúdos da Trilha */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {conteudos.map((item) => (
                    <div key={item.id} style={{
                        backgroundColor: theme.cardBackground,
                        borderRadius: 16,
                        padding: '20px 24px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                        border: item.concluido ? `1px solid ${theme.cardBorder}` : `1px solid ${theme.accentLight}40`,
                        opacity: item.concluido ? 0.75 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        transition: 'background-color 0.3s ease',
                    }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <button
                                    onClick={() => toggleConcluido(item.id)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                        color: item.concluido ? theme.success : theme.textTertiary, marginTop: 2, transition: 'color 0.3s ease'
                                    }}
                                    title={item.concluido ? 'Marcar como não concluído' : 'Marcar como concluído'}
                                >
                                    <IconCheckCircle />
                                </button>

                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{
                                            fontSize: '0.72rem', fontWeight: 600,
                                            color: item.categoria === 'Hard Skill' ? theme.accent : '#7C3AED',
                                            backgroundColor: item.categoria === 'Hard Skill' ? `${theme.accent}1A` : '#F5F3FF',
                                            padding: '2px 8px', borderRadius: 6, transition: 'all 0.3s ease'
                                        }}>
                                            {item.categoria}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: theme.textSecondary, transition: 'color 0.3s ease' }}>
                                            {item.tipo} &nbsp;·&nbsp; {item.provedor} &nbsp;·&nbsp; {item.duracao}
                                        </span>
                                        {item.recomendadoIA && !item.concluido && (
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: 600, color: theme.accent,
                                                display: 'flex', alignItems: 'center', gap: 4, backgroundColor: `${theme.accent}1A`,
                                                padding: '2px 8px', borderRadius: 999, transition: 'all 0.3s ease'
                                            }}>
                                                <IconSparkles /> Recomendado
                                            </span>
                                        )}
                                    </div>

                                    <h4 style={{
                                        fontSize: '0.98rem', fontWeight: 600, color: theme.text, margin: 0,
                                        textDecoration: item.concluido ? 'line-through' : 'none', transition: 'color 0.3s ease'
                                    }}>
                                        {item.titulo}
                                    </h4>
                                </div>
                            </div>

                            <button style={{
                                background: 'none', border: `1px solid ${theme.cardBorder}`, borderRadius: 8,
                                padding: '8px 14px', fontSize: '0.8rem', fontWeight: 600, color: theme.text,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, transition: 'all 0.3s ease'
                            }}>
                                Acessar <IconExternalLink />
                            </button>
                        </div>
                    ))}
                </div>
        </div>
    );
}