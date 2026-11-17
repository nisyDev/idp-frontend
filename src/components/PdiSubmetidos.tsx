import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import type { UsuarioAutenticado } from '../services/auth';
import { ApiError } from '../services/http';
import { listarSubmetidos } from '../services/pdis';
import type { PdiSubmetidoResponse, StatusAprovacaoPdi } from '../types/pdi';
import PdiVersaoDetalhes from './PdiVersaoDetalhes';
import './PdiRascunhosReais.css';
import './PdiVersoes.css';

interface PdiSubmetidosProps {
    usuario: UsuarioAutenticado;
    onSessaoExpirada: (usuarioId: string) => void;
}

const rotulosAprovacao: Record<StatusAprovacaoPdi, string> = {
    RASCUNHO: 'Rascunho', AGUARDANDO_APROVACAO: 'Aguardando aprovação',
    APROVADO: 'Aprovado', REPROVADO: 'Reprovado', RETIRADA: 'Retirada',
};

export default function PdiSubmetidos(props: PdiSubmetidosProps) {
    return <SubmetidosDoUsuario key={props.usuario.id + ':' + props.usuario.perfil} {...props} />;
}

function SubmetidosDoUsuario({ usuario, onSessaoExpirada }: PdiSubmetidosProps) {
    const { theme } = useTheme();
    const [versoes, setVersoes] = useState<PdiSubmetidoResponse[] | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [statusErro, setStatusErro] = useState<number | null>(null);
    const [atualizacao, setAtualizacao] = useState(0);
    const [selecionada, setSelecionada] = useState<{ pdiId: number; versaoId: number } | null>(null);
    const geracao = useRef(0);

    useEffect(() => {
        const controller = new AbortController();
        const atual = ++geracao.current;
        let ativo = true;
        const vigente = () => ativo && !controller.signal.aborted && atual === geracao.current;
        listarSubmetidos(controller.signal).then((lista) => {
            if (vigente()) setVersoes(lista);
        }).catch((falha: unknown) => {
            if (!vigente()) return;
            const status = falha instanceof ApiError ? falha.status : null;
            setStatusErro(status);
            setErro(falha instanceof ApiError ? falha.message : 'Não foi possível consultar seus PDIs submetidos.');
            if (status === 401 || status === 403 || status === 404) setVersoes(null);
            if (status === 401) onSessaoExpirada(usuario.id);
        }).finally(() => { if (vigente()) setCarregando(false); });
        return () => { ativo = false; controller.abort(); };
    }, [usuario.id, usuario.perfil, atualizacao, onSessaoExpirada]);

    function atualizar() {
        geracao.current += 1;
        setCarregando(true);
        setErro('');
        setStatusErro(null);
        setAtualizacao((valor) => valor + 1);
    }

    const cores: CSSProperties & Record<string, string> = {
        '--pdi-real-text': theme.text, '--pdi-real-muted': theme.textSecondary,
        '--pdi-real-background': theme.cardBackground, '--pdi-real-border': theme.cardBorder,
        '--pdi-real-secondary': theme.backgroundSecondary, '--pdi-real-accent': theme.accent,
        '--pdi-real-input': theme.inputBackground, '--pdi-real-canvas': theme.background,
        '--pdi-real-error': theme.error,
    };

    return (
        <section className="pdi-real" style={cores} aria-labelledby="pdi-submetidos-heading" aria-busy={carregando}>
            <header className="pdi-real-heading">
                <div>
                    <h1 id="pdi-submetidos-heading">PDIs submetidos e decisões</h1>
                    <p className="pdi-real-muted">Consulte as versões enviadas, as decisões e a versão vigente do seu PDI.</p>
                </div>
                <button type="button" className="pdi-real-button"
                    disabled={carregando || selecionada !== null || statusErro === 401}
                    onClick={atualizar}>Atualizar submetidos</button>
            </header>
            {carregando && <p role="status">Carregando seus PDIs submetidos…</p>}
            {erro && <div className="pdi-real-feedback pdi-real-feedback-error" role="alert">
                <h2>{statusErro === 403 ? 'Consulta não autorizada' : 'Não foi possível concluir a consulta'}</h2>
                <p>{erro}</p>
                {versoes !== null && <p>Os dados anteriores foram mantidos. Atualize a lista antes de abrir uma versão.</p>}
            </div>}
            {!carregando && !erro && versoes?.length === 0 && (
                <div className="pdi-real-feedback" role="status"><h2>Nenhuma versão submetida</h2>
                    <p>Os PDIs aparecerão aqui após a submissão de um rascunho.</p></div>
            )}
            {versoes !== null && <div className="pdi-real-list">
                {versoes.map((versao) => (
                    <article className="pdi-real-card" key={versao.id + '-' + versao.versaoId}>
                        <div className="pdi-real-card-top">
                            <h2>{versao.titulo?.trim() || 'Título não informado'}</h2>
                            <span className="pdi-real-badge">{rotulosAprovacao[versao.statusAprovacao]}</span>
                            {versao.versaoId === versao.versaoVigenteId && <span className="pdi-real-badge">Versão vigente</span>}
                        </div>
                        <p className="pdi-real-muted">PDI #{versao.id} · Versão {versao.numero}</p>
                        <p>{versao.objetivo?.trim() || 'Objetivo não informado.'}</p>
                        <div className="pdi-real-toolbar">
                            <button type="button" className="pdi-real-button" disabled={carregando || !!erro || selecionada !== null}
                                onClick={() => setSelecionada({ pdiId: versao.id, versaoId: versao.versaoId })}>
                                Ver versão {versao.numero}
                            </button>
                            {versao.versaoVigenteId != null && versao.versaoVigenteId !== versao.versaoId && (
                                <button type="button" className="pdi-real-button" disabled={carregando || !!erro || selecionada !== null}
                                    onClick={() => setSelecionada({ pdiId: versao.id, versaoId: versao.versaoVigenteId! })}>
                                    Consultar vigente
                                </button>
                            )}
                        </div>
                    </article>
                ))}
            </div>}
            {selecionada && <PdiVersaoDetalhes key={selecionada.pdiId + '-' + selecionada.versaoId}
                {...selecionada} usuario={usuario} onSessaoExpirada={onSessaoExpirada}
                onFechar={() => { setSelecionada(null); atualizar(); }} />}
        </section>
    );
}
