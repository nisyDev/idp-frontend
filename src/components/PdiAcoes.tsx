import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ApiError } from '../services/http';
import { listarAcoesPdi } from '../services/acoesPdi';
import { podeEditarRascunho } from '../services/pdis';
import type { AcaoPdiResponse } from '../types/acaoPdi';
import type { PdiRascunhoResponse } from '../types/pdi';
import AcaoPdiFormulario from './AcaoPdiFormulario';
import './PdiAcoes.css';

interface PdiAcoesProps {
    pdi: PdiRascunhoResponse;
    bloqueado: boolean;
    onSessaoExpirada: () => void;
}

type EditorAcao = { modo: 'criacao' } | { modo: 'edicao'; acao: AcaoPdiResponse };

type EstadoAcoes =
    | { tipo: 'carregando'; acoes: AcaoPdiResponse[] | null }
    | { tipo: 'sucesso'; acoes: AcaoPdiResponse[] }
    | { tipo: 'erro'; acoes: AcaoPdiResponse[] | null; status: number | null; mensagem: string };

const execucao: Record<AcaoPdiResponse['statusExecucao'], string> = {
    NAO_INICIADA: 'Não iniciada',
    EM_EXECUCAO: 'Em execução',
    CONCLUIDA: 'Concluída',
};

function dataPlanejada(value: string | null): string {
    if (!value) return 'Não informado';
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return partes ? partes[3] + '/' + partes[2] + '/' + partes[1] : 'Data indisponível';
}

function periodoPlanejado(acao: AcaoPdiResponse): string {
    if (acao.inicioPlanejado && acao.fimPlanejado) {
        return dataPlanejada(acao.inicioPlanejado) + ' a ' + dataPlanejada(acao.fimPlanejado);
    }
    if (acao.inicioPlanejado) return 'Início: ' + dataPlanejada(acao.inicioPlanejado);
    if (acao.fimPlanejado) return 'Fim: ' + dataPlanejada(acao.fimPlanejado);
    return 'Período planejado não informado';
}

export default function PdiAcoes({ pdi, bloqueado, onSessaoExpirada }: PdiAcoesProps) {
    const tituloId = useId();
    const permitido = podeEditarRascunho(pdi);
    const [consulta, setConsulta] = useState<EstadoAcoes>({ tipo: 'carregando', acoes: null });
    const [atualizacao, setAtualizacao] = useState(0);
    const [editor, setEditor] = useState<EditorAcao | null>(null);
    const [confirmacao, setConfirmacao] = useState('');
    const geracao = useRef(0);

    useEffect(() => {
        if (!permitido) return;
        const controller = new AbortController();
        const atual = ++geracao.current;
        let ativo = true;
        const vigente = () => ativo && !controller.signal.aborted && geracao.current === atual;
        setConsulta((anterior) => ({ tipo: 'carregando', acoes: anterior.acoes }));

        listarAcoesPdi(pdi.id, pdi.versaoId, controller.signal)
            .then((acoes) => {
                if (vigente()) setConsulta({ tipo: 'sucesso', acoes });
            })
            .catch((error: unknown) => {
                if (!vigente()) return;
                const status = error instanceof ApiError ? error.status : null;
                setConsulta((anterior) => ({
                    tipo: 'erro', status,
                    acoes: status === 401 || status === 403 || status === 404 || status === 409
                        ? null : anterior.acoes,
                    mensagem: error instanceof ApiError
                        ? error.message : 'Não foi possível consultar as ações. Tente novamente.',
                }));
                if (status === 401) onSessaoExpirada();
            });

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [pdi.id, pdi.versaoId, permitido, atualizacao, onSessaoExpirada]);

    const atualizar = useCallback(() => {
        geracao.current += 1;
        setConsulta((anterior) => ({ tipo: 'carregando', acoes: anterior.acoes }));
        setAtualizacao((value) => value + 1);
    }, []);

    const fecharFormulario = useCallback(() => {
        setEditor(null);
        // Recheck availability, including after a conflict or an unconfirmed write.
        atualizar();
    }, [atualizar]);

    const aoSalvar = useCallback((acao: AcaoPdiResponse, modo: 'criacao' | 'edicao') => {
        geracao.current += 1;
        setEditor(null);
        setConfirmacao(modo === 'edicao' ? 'Ação atualizada com sucesso.' : 'Ação cadastrada com sucesso.');
        setConsulta((anterior) => {
            if (!anterior.acoes) return { tipo: 'carregando', acoes: null };
            const acoes = anterior.acoes.filter((item) => item.id !== acao.id);
            acoes.push(acao);
            acoes.sort((a, b) => a.ordem - b.ordem || a.acaoVersaoId - b.acaoVersaoId);
            return { tipo: 'sucesso', acoes };
        });
        setAtualizacao((value) => value + 1);
    }, []);

    function abrirFormulario() {
        if (bloqueado || !permitido || consulta.tipo !== 'sucesso' || editor !== null) return;
        setConfirmacao('');
        setEditor({ modo: 'criacao' });
    }

    function abrirEdicao(acao: AcaoPdiResponse) {
        if (bloqueado || !permitido || consulta.tipo !== 'sucesso' || editor !== null
            || acao.pdiId !== pdi.id || acao.pdiVersaoId !== pdi.versaoId) return;
        setConfirmacao('');
        setEditor({ modo: 'edicao', acao });
    }

    const acoes = consulta.acoes;
    const carregando = consulta.tipo === 'carregando';
    const sessaoExpirada = consulta.tipo === 'erro' && consulta.status === 401;

    return (
        <section className="pdi-acoes" aria-labelledby={tituloId}>
            <header className="pdi-acoes-header">
                <div className="pdi-acoes-heading">
                    <h3 id={tituloId}>Ações do PDI</h3>
                    {permitido && acoes !== null && (
                        <span className="pdi-real-badge">{acoes.length} {acoes.length === 1 ? 'ação' : 'ações'}</span>
                    )}
                </div>
                {permitido && (
                    <div className="pdi-acoes-toolbar">
                        <button
                            type="button" className="pdi-real-button"
                            onClick={atualizar}
                            disabled={bloqueado || carregando || editor !== null || sessaoExpirada}
                        >Atualizar ações</button>
                        <button
                            type="button" className="pdi-real-button pdi-real-button-primary"
                            onClick={abrirFormulario}
                            disabled={bloqueado || consulta.tipo !== 'sucesso' || editor !== null}
                        ><span aria-hidden="true">+</span> Nova ação</button>
                    </div>
                )}
            </header>

            {!permitido ? (
                <p className="pdi-acoes-note" role="status">As ações não estão disponíveis para consulta neste estado do PDI.</p>
            ) : (
                <>
                    {confirmacao && <p className="pdi-acoes-confirmation" role="status">{confirmacao}</p>}
                    {carregando && (
                        <p className="pdi-acoes-note" role="status" aria-busy="true">
                            {acoes === null ? 'Carregando as ações deste PDI…' : 'Atualizando as ações deste PDI…'}
                        </p>
                    )}
                    {consulta.tipo === 'erro' && (
                        <div className="pdi-acoes-error" role="alert">
                            <p>{consulta.mensagem}</p>
                            {acoes !== null && <p>As ações já carregadas foram mantidas.</p>}
                            {!sessaoExpirada && (
                                <button type="button" className="pdi-real-button" onClick={atualizar} disabled={bloqueado || editor !== null}>
                                    Tentar novamente
                                </button>
                            )}
                        </div>
                    )}
                    {acoes !== null && (acoes.length === 0 ? (
                        <p className="pdi-acoes-note" role="status">
                            Este PDI ainda não possui ações.
                            {consulta.tipo === 'sucesso' && ' Use “Nova ação” para cadastrar a primeira.'}
                        </p>
                    ) : (
                        <div className="pdi-acoes-list">
                            {acoes.map((acao) => (
                                <article key={acao.id} className="pdi-acoes-card" aria-labelledby={'acao-pdi-title-' + acao.acaoVersaoId}>
                                    <div className="pdi-acoes-card-header">
                                        <h4 id={'acao-pdi-title-' + acao.acaoVersaoId}>{acao.titulo?.trim() || 'Título não informado'}</h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <span className="pdi-real-badge">{execucao[acao.statusExecucao]}</span>
                                            <button
                                                type="button"
                                                className="pdi-real-button pdi-real-button-compact"
                                                onClick={() => abrirEdicao(acao)}
                                                disabled={bloqueado || consulta.tipo !== 'sucesso' || editor !== null}
                                                aria-label={'Editar ação ' + (acao.titulo?.trim() || '#' + acao.id)}
                                            >Editar</button>
                                        </div>
                                    </div>
                                    <dl className="pdi-acoes-fields">
                                        <div><dt>Objetivo</dt><dd>{acao.objetivo?.trim() || 'Objetivo não informado.'}</dd></div>
                                        <div><dt>Resultado esperado</dt><dd>{acao.resultadoEsperado?.trim() || 'Resultado esperado não informado.'}</dd></div>
                                        <div className="pdi-acoes-period"><dt>Período planejado</dt><dd>{periodoPlanejado(acao)}</dd></div>
                                    </dl>
                                </article>
                            ))}
                        </div>
                    ))}
                </>
            )}

            {permitido && editor !== null && (
                <AcaoPdiFormulario
                    key={editor.modo === 'edicao' ? 'editar-' + editor.acao.id : 'criar'}
                    pdi={pdi}
                    acao={editor.modo === 'edicao' ? editor.acao : undefined}
                    onFechar={fecharFormulario}
                    onSalvo={aoSalvar}
                    onSessaoExpirada={onSessaoExpirada}
                />
            )}
        </section>
    );
}
