import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// ─── Ícones inline (Lucide-style SVG) ─────────────────────────────────────────
const IconPlus = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
);
const IconChevronRight = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
    </svg>
);

export default function DashboardPage({
                                          nomeUsuario = 'Ana Lima',
                                      }: {
    nomeUsuario?: string;
    perfil?: string;
}) {
    const { theme } = useTheme();
    const [pdis] = useState([
        {
            id: 1,
            titulo: 'Plano de Transição — Liderança Técnica 2026',
            objetivo: 'Desenvolver soft skills de liderança e arquitetura de sistemas front-end para assumir Tech Lead.',
            gestora: 'Diego Rocha',
            prazo: 'Dez/2026',
            progresso: 65,
            status: 'Em Andamento',
        },
        {
            id: 2,
            titulo: 'Aprimoramento em Arquitetura Front-end',
            objetivo: 'Dominar Micro-frontends, Design Systems e otimização de performance Web.',
            gestora: 'Diego Rocha',
            prazo: 'Jul/2026',
            progresso: 100,
            status: 'Concluído',
        },
    ]);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: theme.background, fontFamily: "'Inter', sans-serif", transition: 'background-color 0.3s ease' }}>
            <div style={{ padding: '40px', maxWidth: 1000, margin: '0 auto' }}>

                {/* Título & Ações */}
                <div style={{
                   display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                   backgroundColor: theme.cardBackground, padding: '24px 28px', borderRadius: 20,
                   boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: `1px solid ${theme.cardBorder}`, marginBottom: 28,
                   transition: 'all 0.3s ease'
                }}>
                   <div>
                       <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: theme.text, margin: 0, marginBottom: 4, letterSpacing: '-0.02em' }}>
                           Planos de Desenvolvimento (PDI) — {nomeUsuario}
                       </h1>
                       <p style={{ color: theme.textSecondary, fontSize: '0.875rem', margin: 0 }}>
                           Gestor responsável: <strong>Diego Rocha</strong>
                       </p>
                   </div>

                   <button style={{
                       backgroundColor: theme.accent, color: '#fff', border: 'none',
                       padding: '10px 18px', borderRadius: 12, fontWeight: 600, fontSize: '0.85rem',
                       cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                       boxShadow: `0 4px 12px ${theme.mode === 'dark' ? 'rgba(96, 165, 250, 0.25)' : 'rgba(37, 99, 235, 0.25)'}`,
                       transition: 'all 0.2s ease'
                   }}>
                       <IconPlus /> Novo PDI
                   </button>
                </div>

                {/* Cards dos PDIs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                   {pdis.map((pdi) => (
                       <div key={pdi.id} style={{
                           backgroundColor: theme.cardBackground, borderRadius: 20, padding: 28,
                           boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: `1px solid ${theme.cardBorder}`,
                           display: 'flex', flexDirection: 'column', gap: 16,
                           transition: 'all 0.3s ease'
                       }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                               <div>
                                   <span style={{
                                       fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                                       backgroundColor: pdi.status === 'Concluído' ? '#DCFCE7' : theme.mode === 'dark' ? '#3730A3' : '#EEF2FF',
                                       color: pdi.status === 'Concluído' ? '#15803D' : theme.accent
                                   }}>
                                       {pdi.status}
                                   </span>
                                   <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: theme.text, margin: '8px 0 4px 0' }}>
                                       {pdi.titulo}
                                   </h3>
                                   <p style={{ fontSize: '0.875rem', color: theme.textSecondary, margin: 0 }}>
                                       {pdi.objetivo}
                                   </p>
                               </div>

                               <button style={{
                                   background: 'none', border: 'none', color: theme.accent,
                                   cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                   fontWeight: 600, fontSize: '0.85rem', transition: 'color 0.2s ease'
                               }}>
                                   Detalhes <IconChevronRight />
                               </button>
                           </div>

                           {/* Barra de Progresso */}
                           <div>
                               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: theme.textSecondary, marginBottom: 6 }}>
                                   <span>Progresso Geral</span>
                                   <strong>{pdi.progresso}%</strong>
                               </div>
                               <div style={{ width: '100%', height: 8, backgroundColor: theme.mode === 'dark' ? '#334155' : '#F3F4F6', borderRadius: 999, overflow: 'hidden' }}>
                                   <div style={{
                                       width: `${pdi.progresso}%`, height: '100%',
                                       backgroundColor: pdi.status === 'Concluído' ? '#16A34A' : theme.accent,
                                       borderRadius: 999,
                                       transition: 'width 0.3s ease'
                                   }} />
                               </div>
                           </div>
                       </div>
                   ))}
                </div>

            </div>
        </div>
    );
}