import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import type { UsuarioAutenticado } from '../services/auth';
import { ApiError } from '../services/http';
import { listarPendentes } from '../services/pdis';
import type { PdiDecisaoResponse, PdiVersaoResponse } from '../types/pdi';
import PdiVersaoDetalhes from './PdiVersaoDetalhes';
import './PdiRascunhosReais.css';
import './PdiVersoes.css';

interface PdiPendentesProps {
    usuario: UsuarioAutenticado;
    onSessaoExpirada: (usuarioId: string) => void;
}

export default function PdiPendentes(props: PdiPendentesProps) {
    return <PendentesDoUsuario key={props.usuario.id + ':' + props.usuario.perfil} {...props} />;
}

function PendentesDoUsuario({ usuario, onSessaoExpirada }: PdiPendentesProps) {
    const { theme } = useTheme();
    const perfilDecisor = usuario.perfil === 'GESTOR' || usuario.perfil === 'RH_ADMIN';
    const [pendentes, setPendentes] = useState<PdiVersaoResponse[] | null>(null);
    const [carregando, setCarregando] = useState(perfilDecisor);
    const [erro, setErro] = useState('');
    const [statusErro, setStatusErro] = useState<number | null>(null);
    const [confirmacao, setConfirmacao] = useState('');
    const [atualizacao, setAtualizacao] = useState(0);
    const [selecionada, setSelecionada] = useState<PdiVersaoResponse | null>(null);
    const geracao = useRef(0);

    useEffect(() => {
        if (!perfilDecisor) return;
        const controller = new AbortController();
        const atual = ++geracao.current;
        let ativo = true;
        const vigente = () => ativo && !controller.signal.aborted && atual === geracao.current;
        listarPendentes(controller.signal).then((lista) => {
            if (vigente()) setPendentes(lista);
        }).catch((falha: unknown) => {
            if (!vigente()) return;
            const status = falha instanceof ApiError ? falha.status : null;
            setStatusErro(status);
            setErro(status === 403 ? 'Seu acesso não está autorizado a consultar ou decidir estas pendências.'
                : falha instanceof ApiError ? falha.message : 'Não foi possível consultar as pendências.');
            if (status === 401 || status === 403 || status === 404) setPendentes(null);
            if (status === 401) onSessaoExpirada(usuario.id);
        }).finally(() => { if (vigente()) setCarregando(false); });
        return () => { ativo = false; controller.abort(); };
    }, [usuario.id, usuario.perfil, perfilDecisor, atualizacao, onSessaoExpirada]);

    const cores: CSSProperties & Record<string, string> = {
        '--pdi-real-text': theme.text, '--pdi-real-muted': theme.textSecondary,
        '--pdi-real-background': theme.cardBackground, '--pdi-real-border': theme.cardBorder,
        '--pdi-real-secondary': theme.backgroundSecondary, '--pdi-real-accent': theme.accent,
        '--pdi-real-input': theme.inputBackground, '--pdi-real-canvas': theme.background,
        '--pdi-real-error': theme.error,
    };

    function atualizar() {
        geracao.current += 1;
        setCarregando(true);
        setErro('');
        setStatusErro(null);
        setAtualizacao((valor) => valor + 1);
    }

    function decisaoConfirmada(resposta: PdiDecisaoResponse) {
        setPendentes((anteriores) => anteriores?.filter((versao) =>
            versao.versaoId !== resposta.versaoDecidida.versaoId) ?? null);
        setConfirmacao(resposta.versaoDecidida.statusAprovacao === 'APROVADO'
            ? 'Aprovação registrada com sucesso.'
            : 'Rejeição registrada. A nova revisão está disponível somente ao titular.');
        atualizar();
    }

    return (
        <section className="pdi-real" style={cores} aria-labelledby="pdi-pendentes-heading" aria-busy={carregando}>
            <header className="pdi-real-heading">
                <div>
                    <h1 id="pdi-pendentes-heading">PDIs pendentes de decisão</h1>
                    <p className="pdi-real-muted">Consulte as versões que aguardam sua análise.</p>
                </div>
                {perfilDecisor && <button type="button" className="pdi-real-button"
                    disabled={carregando || selecionada !== null || statusErro === 401}
                    onClick={atualizar}>Atualizar pendências</button>}
            </header>
            {!perfilDecisor && <p role="alert">Seu perfil não permite decidir PDIs.</p>}
            {confirmacao && <p className="pdi-real-confirmation" role="status">{confirmacao}</p>}
            {perfilDecisor && carregando && <p role="status">Carregando as pendências autorizadas…</p>}
            {erro && <div className="pdi-real-feedback pdi-real-feedback-error" role="alert">
                <h2>{statusErro === 403 ? 'Acesso não autorizado' : 'Não foi possível consultar as pendências'}</h2>
                <p>{erro}</p>
                {pendentes !== null && <p>Os dados anteriores foram mantidos. Atualize a lista antes de decidir.</p>}
            </div>}
            {perfilDecisor && !carregando && !erro && pendentes?.length === 0 && (
                <div className="pdi-real-feedback" role="status"><h2>Nenhum PDI pendente</h2>
                    <p>Não há versões aguardando sua decisão neste momento.</p></div>
            )}
            {perfilDecisor && pendentes !== null && <div className="pdi-real-list">
                {pendentes.map((versao) => (
                    <article className="pdi-real-card" key={versao.id + '-' + versao.versaoId}>
                        <div className="pdi-real-card-top"><h2>{versao.titulo?.trim() || 'Título não informado'}</h2>
                            <span className="pdi-real-badge">Aguardando aprovação</span></div>
                        <p className="pdi-real-muted">PDI #{versao.id} · Versão {versao.numero}</p>
                        <p className="pdi-real-muted">Titular: {versao.titularId === usuario.id ? usuario.nome : versao.titularId}</p>
                        <p>{versao.objetivo?.trim() || 'Objetivo não informado.'}</p>
                        <button type="button" className="pdi-real-button pdi-real-button-primary"
                            disabled={carregando || !!erro || selecionada !== null}
                            onClick={() => { setConfirmacao(''); setSelecionada(versao); }}>Consultar e decidir</button>
                    </article>
                ))}
            </div>}
            {selecionada && <PdiVersaoDetalhes key={selecionada.id + '-' + selecionada.versaoId}
                pdiId={selecionada.id} versaoId={selecionada.versaoId} usuario={usuario} permitirDecisao
                onSessaoExpirada={onSessaoExpirada} onDecisaoConfirmada={decisaoConfirmada}
                onFechar={() => { setSelecionada(null); atualizar(); }} />}
        </section>
    );
}
