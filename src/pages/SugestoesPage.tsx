import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface Sugestao {
    id: string;
    titulo: string;
    categoria: string;
    mensagem: string;
    autor: string;
    data: string;
    votos: number;
    status: string;
}

export default function SugestoesPage({ nomeUsuario = 'Ana Souza', perfil = 'COLABORADOR' }: { nomeUsuario?: string; perfil?: string }) {
    const { theme } = useTheme();
    const [sugestoes, setSugestoes] = useState<Sugestao[]>([
        { id: 's1', titulo: 'Trilhas de aprendizado por senioridade', categoria: 'Processo', mensagem: 'Criar trilhas claras de jr→pleno→sr por área.', autor: 'Ana Souza', data: '22/05/2026', votos: 2, status: 'Em análise' },
        { id: 's2', titulo: 'Budget anual para cursos', categoria: 'Cultura', mensagem: 'R$ X por colaborador por ano com aprovação simples.', autor: 'Diego Rocha', data: '02/06/2026', votos: 1, status: 'Aberta' },
    ]);

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ titulo: '', categoria: 'Processo', mensagem: '' });

    const abrirModal = () => setShowModal(true);
    const fecharModal = () => {
        setShowModal(false);
        setForm({ titulo: '', categoria: 'Processo', mensagem: '' });
    };

    const enviarSugestao = () => {
        const nova: Sugestao = {
            id: `s-${Date.now()}`,
            titulo: form.titulo || 'Sem título',
            categoria: form.categoria,
            mensagem: form.mensagem,
            autor: nomeUsuario,
            data: new Date().toLocaleDateString('pt-BR'),
            votos: 0,
            status: 'Aberta'
        };
        setSugestoes(prev => [nova, ...prev]);
        fecharModal();
    };

    const votar = (id: string) => {
        setSugestoes(prev => prev.map(s => s.id === id ? { ...s, votos: s.votos + 1 } : s));
    };

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 40, fontFamily: "'Inter', sans-serif" }}>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: theme.text, margin: 0, marginBottom: 4 }}>Sugestões</h1>
                <p style={{ color: theme.textSecondary, fontSize: '0.95rem', margin: 0 }}>Caixa aberta para melhorias de processos, cultura e ferramentas.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button onClick={abrirModal} style={{ padding: '10px 14px', borderRadius: 10, background: theme.accent, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>+ Nova sugestão</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {sugestoes.map(s => (
                    <div key={s.id} style={{ display: 'flex', gap: 16, backgroundColor: theme.cardBackground, border: `1px solid ${theme.cardBorder}`, borderRadius: 12, padding: 18, alignItems: 'center' }}>
                        <div style={{ width: 64, height: 64, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.backgroundSecondary, flexShrink: 0 }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: theme.text }}>{s.votos}</div>
                                <div style={{ fontSize: '0.75rem', color: theme.textSecondary }}>↑</div>
                            </div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: theme.text }}>{s.titulo}</div>
                                <span style={{ fontSize: '0.72rem', color: theme.textSecondary, padding: '4px 8px', borderRadius: 999, border: `1px solid ${theme.cardBorder}` }}>{s.categoria}</span>
                                <span style={{ fontSize: '0.72rem', color: theme.textSecondary, padding: '4px 8px', borderRadius: 999, backgroundColor: `${theme.accent}1A`, color: theme.accent }}>{s.status}</span>
                            </div>
                            <div style={{ color: theme.textSecondary, marginBottom: 8 }}>{s.mensagem}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: theme.textSecondary }}>
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentLight})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{s.autor.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}</div>
                                    <div style={{ fontSize: '0.85rem' }}>{s.autor} · {s.data}</div>
                                </div>
                                <div style={{ marginLeft: 'auto' }}>
                                    <button onClick={() => votar(s.id)} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.cardBackground, cursor: 'pointer' }}>Votar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
                    <div style={{ width: 680, borderRadius: 12, backgroundColor: theme.background, padding: 24, border: `1px solid ${theme.cardBorder}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <h3 style={{ margin: 0, color: theme.text }}>Nova sugestão</h3>
                            <button onClick={fecharModal} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>×</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <label style={{ fontSize: '0.9rem', color: theme.textSecondary }}>Título</label>
                            <input value={form.titulo} onChange={(e)=>setForm(f=>({ ...f, titulo: e.target.value }))} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${theme.inputBorder}`, backgroundColor: theme.inputBackground }} />

                            <label style={{ fontSize: '0.9rem', color: theme.textSecondary }}>Categoria</label>
                            <select value={form.categoria} onChange={(e)=>setForm(f=>({ ...f, categoria: e.target.value }))} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${theme.inputBorder}`, backgroundColor: theme.inputBackground }}>
                                <option>Processo</option>
                                <option>Cultura</option>
                                <option>Ferramenta</option>
                                <option>Outro</option>
                            </select>

                            <label style={{ fontSize: '0.9rem', color: theme.textSecondary }}>Mensagem</label>
                            <textarea value={form.mensagem} onChange={(e)=>setForm(f=>({ ...f, mensagem: e.target.value }))} style={{ minHeight: 120, padding: '10px 12px', borderRadius: 8, border: `1px solid ${theme.inputBorder}`, backgroundColor: theme.inputBackground }} />

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                                <button onClick={fecharModal} style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: theme.cardBackground, border: `1px solid ${theme.cardBorder}` }}>Cancelar</button>
                                <button onClick={enviarSugestao} style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: theme.accent, color: '#fff', border: 'none' }}>Enviar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
