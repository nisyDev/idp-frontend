import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

// ─── ÍCONES ─────────────────────────────────────────────────────────────────
const IconTarget = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
);

const IconCheck = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
    </svg>
);

export default function PdiPage() {
    const { theme } = useTheme();
    const metas = [
        {
            id: '1',
            titulo: 'Desenvolver competência em Arquitetura Front-end Avançada',
            prazos: 'Até Q3 2026',
            progresso: 75,
            status: 'Em Andamento',
            categoria: 'Hard Skill'
        },
        {
            id: '2',
            titulo: 'Concluir Capacitação em Liderança Técnica e Gestão de Conflitos',
            prazos: 'Até Set/2026',
            progresso: 40,
            status: 'Em Andamento',
            categoria: 'Soft Skill'
        },
        {
            id: '3',
            titulo: 'Implementar Acessibilidade Web (WCAG 2.1) no sistema BGP',
            prazos: 'Concluído em Jul/2026',
            progresso: 100,
            status: 'Concluído',
            categoria: 'Projeto Prático'
        }
    ];

    return (
        <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '40px' }}>

            {/* ── CABEÇALHO PADRONIZADO ────────────────────────────────────────── */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{
                   fontSize: '1.5rem',
                   fontWeight: 700,
                   color: theme.text,
                   letterSpacing: '-0.02em',
                   margin: '0 0 4px 0',
                   transition: 'color 0.3s ease'
                }}>
                   Planos de Desenvolvimento Individual (PDI)
                </h1>
                <p style={{ margin: 0, color: theme.textSecondary, fontSize: '0.875rem', transition: 'color 0.3s ease' }}>
                   Acompanhe suas metas de carreira, progresso e prazos estabelecidos.
                </p>
            </div>

            {/* ── LISTA DE METAS ──────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {metas.map((meta) => {
                   const isConcluido = meta.status === 'Concluído';
                   return (
                       <div
                           key={meta.id}
                           style={{
                               backgroundColor: theme.cardBackground,
                               borderRadius: '16px',
                               border: `1px solid ${theme.cardBorder}`,
                               padding: '20px 24px',
                               boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                               display: 'flex',
                               gap: '18px',
                               alignItems: 'center',
                               transition: 'all 0.3s ease'
                           }}
                       >
                           {/* ÍCONE DE STATUS */}
                           <div style={{
                               width: '40px',
                               height: '40px',
                               borderRadius: '10px',
                               backgroundColor: isConcluido ? '#ECFDF5' : theme.mode === 'dark' ? '#3730A3' : '#EEF2FF',
                               color: isConcluido ? '#10B981' : theme.accent,
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               flexShrink: 0,
                               transition: 'all 0.3s ease'
                           }}>
                               {isConcluido ? <IconCheck /> : <IconTarget />}
                           </div>

                           {/* DETALHES */}
                           <div style={{ flex: 1 }}>
                               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                   <span style={{
                                       fontSize: '0.75rem',
                                       fontWeight: 600,
                                       padding: '3px 10px',
                                       borderRadius: '20px',
                                       backgroundColor: isConcluido ? '#D1FAE5' : theme.mode === 'dark' ? '#3730A3' : '#EEF2FF',
                                       color: isConcluido ? '#065F46' : theme.accent,
                                       transition: 'all 0.3s ease'
                                   }}>
                                       {meta.categoria}
                                   </span>
                                   <span style={{ fontSize: '0.825rem', color: theme.textSecondary, fontWeight: 500, transition: 'color 0.3s ease' }}>
                                       {meta.prazos}
                                   </span>
                               </div>

                               <h3 style={{
                                   fontSize: '1rem',
                                   fontWeight: 600,
                                   color: theme.text,
                                   margin: '0 0 10px 0',
                                   letterSpacing: '-0.01em',
                                   transition: 'color 0.3s ease'
                               }}>
                                   {meta.titulo}
                               </h3>

                               {/* BARRA DE PROGRESSO */}
                               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                   <div style={{ flex: 1, height: '8px', backgroundColor: theme.mode === 'dark' ? '#334155' : '#F1F5F9', borderRadius: '4px', overflow: 'hidden', transition: 'background-color 0.3s ease' }}>
                                       <div style={{
                                           height: '100%',
                                           width: `${meta.progresso}%`,
                                           backgroundColor: isConcluido ? '#10B981' : theme.accent,
                                           borderRadius: '4px',
                                           transition: 'width 0.3s ease, background-color 0.3s ease'
                                       }} />
                                   </div>
                                   <span style={{ fontSize: '0.8rem', fontWeight: 600, color: theme.textSecondary, minWidth: '36px', transition: 'color 0.3s ease' }}>
                                       {meta.progresso}%
                                   </span>
                               </div>
                           </div>
                       </div>
                   );
                })}
            </div>

        </div>
    );
}