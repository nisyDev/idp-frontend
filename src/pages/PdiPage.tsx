import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { UsuarioAutenticado } from '../services/auth';
import { useTheme } from '../contexts/ThemeContext';
import PdiRascunhosReais from '../components/PdiRascunhosReais';
import PdiSubmetidos from '../components/PdiSubmetidos';
import PdiPendentes from '../components/PdiPendentes';
import '../components/PdiRascunhosReais.css';

interface PdiPageProps {
    usuario: UsuarioAutenticado;
    onSessaoExpirada: (usuarioId: string) => void;
}

export default function PdiPage({ usuario, onSessaoExpirada }: PdiPageProps) {
    const { theme } = useTheme();
    const [aba, setAba] = useState<'rascunhos' | 'submetidos' | 'pendentes'>('rascunhos');
    const podeConsultarPendencias = usuario.perfil === 'GESTOR' || usuario.perfil === 'RH_ADMIN';
    const cores: CSSProperties & Record<string, string> = {
        '--pdi-real-text': theme.text,
        '--pdi-real-muted': theme.textSecondary,
        '--pdi-real-background': theme.cardBackground,
        '--pdi-real-border': theme.cardBorder,
        '--pdi-real-secondary': theme.backgroundSecondary,
        '--pdi-real-accent': theme.accent,
        '--pdi-real-input': theme.inputBackground,
        '--pdi-real-canvas': theme.background,
        '--pdi-real-error': theme.error,
    };
    const abas: { id: typeof aba; titulo: string }[] = [
        { id: 'rascunhos', titulo: 'Meus rascunhos' },
        { id: 'submetidos', titulo: 'Submetidos e decisões' },
    ];
    if (podeConsultarPendencias) abas.push({ id: 'pendentes', titulo: 'Pendências de aprovação' });

    return (
        <div style={cores}>
            <nav aria-label="Consultas de PDI" className="pdi-real-toolbar" style={{ marginBottom: 20 }}>
                {abas.map((item) => (
                    <button key={item.id} type="button"
                        className={'pdi-real-button' + (aba === item.id ? ' pdi-real-button-primary' : '')}
                        aria-pressed={aba === item.id}
                        onClick={() => setAba(item.id)}>
                        {item.titulo}
                    </button>
                ))}
            </nav>
            {aba === 'rascunhos' && (
                <PdiRascunhosReais key={usuario.id} usuario={usuario} onSessaoExpirada={onSessaoExpirada} />
            )}
            {aba === 'submetidos' && (
                <PdiSubmetidos key={usuario.id} usuario={usuario} onSessaoExpirada={onSessaoExpirada} />
            )}
            {aba === 'pendentes' && podeConsultarPendencias && (
                <PdiPendentes key={usuario.id} usuario={usuario} onSessaoExpirada={onSessaoExpirada} />
            )}
        </div>
    );
}
