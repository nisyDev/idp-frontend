import { useState } from 'react';
import EditableField from '../components/EditableField';
import { useTheme } from '../contexts/ThemeContext';

interface PerfilPageProps {
    nomeUsuario?: string;
    perfil?: string;
}

export default function PerfilPage({ nomeUsuario = 'Ana Lima', perfil = 'COLABORADOR' }: PerfilPageProps) {
    const { theme } = useTheme();
    const iniciais = nomeUsuario.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    const [userData, setUserData] = useState({
        nome: nomeUsuario,
        cargo: 'Dev Front-end Senior',
        objetivo: 'Tech Lead Front-end',
        gestor: 'Diego Rocha',
        tempo: '2 anos e 4 meses'
    });

    const handleUpdate = (field: string, value: string) => {
        setUserData(prev => ({ ...prev, [field]: value }));
    };
    
    return (
        <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '40px' }}>

            {/* ── CABEÇALHO PADRONIZADO ────────────────────────────────────────── */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: theme.text,
                    letterSpacing: '-0.02em',
                    margin: 0,
                    marginBottom: '4px',
                    transition: 'color 0.3s ease'
                }}>
                    Meu Perfil Profissional
                </h1>
                <p style={{ margin: 0, color: theme.textSecondary, fontSize: '0.875rem', transition: 'color 0.3s ease' }}>
                    Informações do seu cargo atual, objetivo de carreira e histórico.
                </p>
            </div>

            {/* ── CARD PRINCIPAL DE PERFIL ─────────────────────────────────────── */}
            <div style={{
                backgroundColor: theme.cardBackground,
                borderRadius: '16px',
                border: `1px solid ${theme.cardBorder}`,
                padding: '32px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                marginBottom: '24px',
                transition: 'all 0.3s ease'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        color: '#FFFFFF'
                    }}>
                        {iniciais}
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: theme.text, margin: '0 0 4px 0', transition: 'color 0.3s ease' }}>
                            <EditableField
                                value={userData.nome}
                                onChange={(value) => handleUpdate('nome', value)}
                                variant="h2"
                                style={{ fontSize: '1.25rem', fontWeight: 700, color: theme.text, margin: 0 }}
                            />
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: theme.textSecondary, transition: 'color 0.3s ease' }}>
                            <EditableField
                                value={perfil}
                                onChange={() => {}}
                                variant="p"
                                style={{ fontSize: '0.875rem', color: theme.textSecondary, margin: 0 }}
                            />
                            {' • Time de Tecnologia BGP'}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: `1px solid ${theme.cardBorder}`, paddingTop: '20px' }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: theme.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'color 0.3s ease' }}>
                            Cargo Atual
                        </label>
                        <p style={{ fontSize: '0.95rem', fontWeight: 600, color: theme.text, margin: '4px 0 0 0', transition: 'color 0.3s ease' }}>
                            <EditableField
                                value={userData.cargo}
                                onChange={(value) => handleUpdate('cargo', value)}
                                variant="span"
                                style={{ fontSize: '0.95rem', fontWeight: 600, color: theme.text }}
                            />
                        </p>
                    </div>

                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: theme.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'color 0.3s ease' }}>
                            Objetivo de Carreira
                        </label>
                        <p style={{ fontSize: '0.95rem', fontWeight: 600, color: theme.accent, margin: '4px 0 0 0', transition: 'color 0.3s ease' }}>
                            <EditableField
                                value={userData.objetivo}
                                onChange={(value) => handleUpdate('objetivo', value)}
                                variant="span"
                                style={{ fontSize: '0.95rem', fontWeight: 600, color: theme.accent }}
                            />
                        </p>
                    </div>

                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: theme.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'color 0.3s ease' }}>
                            Gestor Direto
                        </label>
                        <p style={{ fontSize: '0.95rem', fontWeight: 600, color: theme.text, margin: '4px 0 0 0', transition: 'color 0.3s ease' }}>
                            <EditableField
                                value={userData.gestor}
                                onChange={(value) => handleUpdate('gestor', value)}
                                variant="span"
                                style={{ fontSize: '0.95rem', fontWeight: 600, color: theme.text }}
                            />
                        </p>
                    </div>

                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: theme.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'color 0.3s ease' }}>
                            Tempo de Empresa
                        </label>
                        <p style={{ fontSize: '0.95rem', fontWeight: 600, color: theme.text, margin: '4px 0 0 0', transition: 'color 0.3s ease' }}>
                            <EditableField
                                value={userData.tempo}
                                onChange={(value) => handleUpdate('tempo', value)}
                                variant="span"
                                style={{ fontSize: '0.95rem', fontWeight: 600, color: theme.text }}
                            />
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
}