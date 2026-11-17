import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { UsuarioAutenticado } from '../services/auth';
import { ApiError } from '../services/http';
import {
    buscarVersao, decidirPdi, GravacaoPdiNaoConfirmadaError, listarVersoes,
} from '../services/pdis';
import type { PdiDecisaoResponse, PdiVersaoResponse, StatusAprovacaoPdi, StatusExecucaoPdi } from '../types/pdi';
import PdiAcoes from './PdiAcoes';
import './PdiRascunhosReais.css';
import './PdiFormulario.css';
import './PdiVersoes.css';

interface PdiVersaoDetalhesProps {
    pdiId: number;
    versaoId: number;
    usuario: UsuarioAutenticado;
    permitirDecisao?: boolean;
    onFechar: () => void;
    onSessaoExpirada: (usuarioId: string) => void;
    onDecisaoConfirmada?: (resposta: PdiDecisaoResponse) => void;
}

const rotulosAprovacao: Record<StatusAprovacaoPdi, string> = {
    RASCUNHO: 'Rascunho', AGUARDANDO_APROVACAO: 'Aguardando aprovação',
    APROVADO: 'Aprovado', REPROVADO: 'Reprovado', RETIRADA: 'Retirada',
};

const rotulosExecucao: Record<StatusExecucaoPdi, string> = {
    NAO_INICIADO: 'Não iniciado', EM_EXECUCAO: 'Em execução', CONCLUIDO: 'Concluído',
};

function dataCalendario(valor: string | null): string {
    if (!valor) return 'Não informado';
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : 'Data indisponível';
}

function dataHora(valor: string | null): string {
    if (!valor) return 'Não informado';
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? 'Data indisponível'
        : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(data);
}

function mensagemFalha(erro: unknown): string {
    if (!(erro instanceof ApiError)) return 'Não foi possível consultar esta versão. Tente novamente.';
    if (erro.status === 401) return 'Sua sessão foi encerrada. Entre novamente.';
    if (erro.status === 403) return 'Você não tem autorização para esta operação.';
    if (erro.status === 404) return 'A versão não foi encontrada ou não está disponível para este acesso.';
    if (erro.status === 409) return 'A versão ou sua autorização mudou. Consulte novamente os dados antes de continuar.';
    return erro.message;
}

export default function PdiVersaoDetalhes(props: PdiVersaoDetalhesProps) {
    return <DetalhesDaVersao
        key={props.pdiId + ':' + props.versaoId + ':' + props.usuario.id + ':' + props.usuario.perfil}
        {...props} />;
}

function DetalhesDaVersao({
    pdiId, versaoId, usuario, permitirDecisao = false,
    onFechar, onSessaoExpirada, onDecisaoConfirmada,
}: PdiVersaoDetalhesProps) {
    const identificador = useId();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const tituloRef = useRef<HTMLHeadingElement>(null);
    const ativoRef = useRef(false);
    const enviandoRef = useRef(false);
    const bloqueadoRef = useRef(false);
    const geracao = useRef(0);
    const gravacaoRef = useRef<AbortController | null>(null);
    const callbacks = useRef({ onFechar, onSessaoExpirada, onDecisaoConfirmada });
    const [selecionada, setSelecionada] = useState(versaoId);
    const [versao, setVersao] = useState<PdiVersaoResponse | null>(null);
    const [versoes, setVersoes] = useState<PdiVersaoResponse[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizacao, setAtualizacao] = useState(0);
    const [erroConsulta, setErroConsulta] = useState('');
    const [sessaoExpirada, setSessaoExpirada] = useState(false);
    const [justificativa, setJustificativa] = useState('');
    const [erroDecisao, setErroDecisao] = useState('');
    const [erroJustificativa, setErroJustificativa] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [bloqueado, setBloqueado] = useState(false);
    const [resultadoIncerto, setResultadoIncerto] = useState(false);
    const [confirmacao, setConfirmacao] = useState('');

    useEffect(() => {
        callbacks.current = { onFechar, onSessaoExpirada, onDecisaoConfirmada };
    }, [onFechar, onSessaoExpirada, onDecisaoConfirmada]);

    useEffect(() => {
        const dialog = dialogRef.current;
        const focoAnterior = document.activeElement;
        ativoRef.current = true;
        dialog?.showModal();
        tituloRef.current?.focus();
        return () => {
            ativoRef.current = false;
            geracao.current += 1;
            gravacaoRef.current?.abort();
            if (dialog?.open) dialog.close();
            if (focoAnterior instanceof HTMLElement && focoAnterior.isConnected) focoAnterior.focus();
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const atual = ++geracao.current;
        const vigente = () => ativoRef.current && !controller.signal.aborted && atual === geracao.current;
        Promise.all([
            buscarVersao(pdiId, selecionada, controller.signal),
            listarVersoes(pdiId, controller.signal),
        ]).then(([detalhe, historico]) => {
            if (!vigente()) return;
            setVersao(detalhe);
            setVersoes(historico);
        }).catch((erro: unknown) => {
            if (!vigente()) return;
            setErroConsulta(mensagemFalha(erro));
            if (erro instanceof ApiError && erro.status === 401) {
                setSessaoExpirada(true);
                callbacks.current.onSessaoExpirada(usuario.id);
            }
        }).finally(() => {
            if (vigente()) setCarregando(false);
        });
        return () => controller.abort();
    }, [pdiId, selecionada, atualizacao, usuario.id, usuario.perfil]);

    const sessaoAcoesExpirada = useCallback(() => {
        callbacks.current.onSessaoExpirada(usuario.id);
    }, [usuario.id]);

    function fechar() {
        if (!enviandoRef.current) callbacks.current.onFechar();
    }

    function prepararConsulta() {
        geracao.current += 1;
        setCarregando(true);
        setErroConsulta('');
        setVersao(null);
        setVersoes([]);
    }

    function consultarNovamente() {
        if (enviandoRef.current || carregando || sessaoExpirada) return;
        // A read can reconcile the displayed state, but never unlocks an uncertain write.
        prepararConsulta();
        setAtualizacao((anterior) => anterior + 1);
    }

    const podeDecidir = permitirDecisao && versao !== null && selecionada === versaoId
        && versao.titularId !== usuario.id
        && (usuario.perfil === 'GESTOR' || usuario.perfil === 'RH_ADMIN')
        && versao.statusAprovacao === 'AGUARDANDO_APROVACAO'
        && versao.submetidaEm !== null && versao.decididaEm === null
        && versao.decididoPorId === null;

    async function registrarDecisao(decisao: 'aprovar' | 'reprovar') {
        if (!ativoRef.current || enviandoRef.current || bloqueadoRef.current
            || carregando || !podeDecidir || !versao) return;
        if (decisao === 'reprovar' && !justificativa.trim()) {
            setErroJustificativa(true);
            setErroDecisao('Preencha a justificativa para rejeitar esta versão.');
            return;
        }
        const controller = new AbortController();
        gravacaoRef.current = controller;
        enviandoRef.current = true;
        setEnviando(true);
        setErroDecisao('');
        setErroJustificativa(false);
        let confirmada: PdiDecisaoResponse | null = null;
        try {
            const resposta = await decidirPdi(pdiId, versao.versaoId, decisao,
                justificativa.trim() || null, controller.signal);
            if (!ativoRef.current || controller.signal.aborted) return;
            bloqueadoRef.current = true;
            setBloqueado(true);
            setVersao(resposta.versaoDecidida);
            setVersoes((anteriores) => anteriores.map((item) => item.versaoId === resposta.versaoDecidida.versaoId
                ? resposta.versaoDecidida : item));
            setConfirmacao(decisao === 'aprovar'
                ? 'Versão aprovada e definida como vigente. A execução permanece não iniciada.'
                : `Versão rejeitada. A revisão ${resposta.novoNumero} foi criada para correção pelo titular.`);
            confirmada = resposta;
        } catch (erro) {
            if (!ativoRef.current || controller.signal.aborted) return;
            const status = erro instanceof ApiError ? erro.status : null;
            if (erro instanceof GravacaoPdiNaoConfirmadaError) {
                bloqueadoRef.current = true;
                setBloqueado(true);
                setResultadoIncerto(true);
                setErroDecisao('Não foi possível confirmar a decisão. Sua justificativa foi mantida. Consulte a situação da versão; a decisão não será reenviada automaticamente.');
            } else {
                setErroDecisao(mensagemFalha(erro));
                if (status === 401 || status === 403 || status === 404 || status === 409) {
                    bloqueadoRef.current = true;
                    setBloqueado(true);
                    setVersao(null);
                    setVersoes([]);
                }
                if (status === 401) {
                    setSessaoExpirada(true);
                    callbacks.current.onSessaoExpirada(usuario.id);
                }
            }
        } finally {
            if (ativoRef.current && !controller.signal.aborted) {
                enviandoRef.current = false;
                gravacaoRef.current = null;
                setEnviando(false);
            }
        }
        // Notify only after the confirmed request; local callbacks must not be classified as HTTP failures.
        // The decision maker receives only the new private draft identity, never its content.
        if (confirmada && ativoRef.current && !controller.signal.aborted) {
            callbacks.current.onDecisaoConfirmada?.(confirmada);
        }
    }

    return (
        <dialog ref={dialogRef} className="pdi-form-dialog pdi-versao-dialog"
            aria-labelledby={identificador + '-titulo'} aria-busy={enviando || carregando}
            onCancel={(event) => { event.preventDefault(); fechar(); }}>
            <header className="pdi-form-header">
                <h2 id={identificador + '-titulo'} className="pdi-form-title" ref={tituloRef} tabIndex={-1}>
                    Versão do PDI
                </h2>
                <p className="pdi-form-note">Consulte o planejamento, as ações e as decisões registradas nesta versão.</p>
            </header>
            <div className="pdi-form-content">
                {carregando && <p role="status">Carregando a versão…</p>}
                {erroConsulta && <p className="pdi-versao-error" role="alert">{erroConsulta}</p>}
                {confirmacao && <p className="pdi-real-confirmation" role="status">{confirmacao}</p>}
                {erroDecisao && <p className="pdi-versao-error" role="alert">{erroDecisao}</p>}
                {versao && (
                    <>
                        <div className="pdi-form-field">
                            <label className="pdi-form-label" htmlFor={identificador + '-versao'}>Versão consultada</label>
                            <select id={identificador + '-versao'} className="pdi-form-input"
                                value={selecionada} disabled={enviando || carregando || bloqueado}
                                onChange={(event) => {
                                    if (enviandoRef.current || bloqueadoRef.current) return;
                                    prepararConsulta();
                                    setSelecionada(Number(event.target.value));
                                    setJustificativa('');
                                    setErroDecisao('');
                                    setErroJustificativa(false);
                                }}>
                                {versoes.map((item) => (
                                    <option key={item.versaoId} value={item.versaoId}>
                                        Versão {item.numero} — {rotulosAprovacao[item.statusAprovacao]}
                                        {item.versaoId === item.versaoVigenteId ? ' — vigente' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <article>
                            <h3>{versao.titulo?.trim() || 'Título não informado'}</h3>
                            <div className="pdi-real-toolbar">
                                <span className="pdi-real-badge">{rotulosAprovacao[versao.statusAprovacao]}</span>
                                <span className="pdi-real-badge">{rotulosExecucao[versao.statusExecucao]}</span>
                                {versao.versaoVigenteId === versao.versaoId && <span className="pdi-real-badge">Versão vigente</span>}
                            </div>
                            <p>{versao.objetivo?.trim() || 'Objetivo não informado.'}</p>
                            <dl className="pdi-real-metadata pdi-versao-metadata">
                                <div><dt>PDI / versão</dt><dd>#{versao.id} / {versao.numero}</dd></div>
                                <div><dt>Titular</dt><dd>{versao.titularId === usuario.id ? usuario.nome : versao.titularId}</dd></div>
                                <div><dt>Início planejado</dt><dd>{dataCalendario(versao.inicioPlanejado)}</dd></div>
                                <div><dt>Fim planejado</dt><dd>{dataCalendario(versao.fimPlanejado)}</dd></div>
                                <div><dt>Submetida em</dt><dd>{dataHora(versao.submetidaEm)}</dd></div>
                                <div><dt>Decidida em</dt><dd>{dataHora(versao.decididaEm)}</dd></div>
                                <div><dt>Responsável pela decisão</dt><dd>{versao.decididoPorId ?? 'Não informado'}</dd></div>
                                <div><dt>Justificativa registrada</dt><dd>{versao.justificativaDecisao?.trim() || 'Não informada'}</dd></div>
                            </dl>
                        </article>
                        <PdiAcoes key={versao.id + '-' + versao.versaoId}
                            pdi={{ id: versao.id, versaoId: versao.versaoId }} somenteLeitura
                            bloqueado={enviando || carregando}
                            onSessaoExpirada={sessaoAcoesExpirada} />
                    </>
                )}
                {(podeDecidir || resultadoIncerto || (permitirDecisao && bloqueado && !!erroDecisao)) && (
                    <section className="pdi-versao-decisao" aria-label="Decisão da versão">
                        <div className="pdi-form-field">
                            <label className="pdi-form-label" htmlFor={identificador + '-justificativa'}>
                                Justificativa (obrigatória para rejeitar)
                            </label>
                            <textarea id={identificador + '-justificativa'} className="pdi-form-input pdi-form-textarea"
                                rows={4} value={justificativa} disabled={enviando}
                                readOnly={bloqueado} aria-invalid={erroJustificativa || undefined}
                                onChange={(event) => { setJustificativa(event.target.value); setErroJustificativa(false); }} />
                        </div>
                        <div className="pdi-real-toolbar">
                            <button type="button" className="pdi-real-button pdi-real-button-primary"
                                disabled={enviando || bloqueado || !podeDecidir} onClick={() => void registrarDecisao('aprovar')}>
                                {enviando ? 'Registrando…' : 'Aprovar versão'}
                            </button>
                            <button type="button" className="pdi-real-button"
                                disabled={enviando || bloqueado || !podeDecidir} onClick={() => void registrarDecisao('reprovar')}>
                                Rejeitar versão
                            </button>
                        </div>
                    </section>
                )}
                {permitirDecisao && versao?.titularId === usuario.id && (
                    <p className="pdi-form-note">Você não pode decidir o próprio PDI.</p>
                )}
                {versao?.statusAprovacao === 'REPROVADO' && versao.titularId === usuario.id && (
                    <p className="pdi-form-note">Abra Meus rascunhos para corrigir a nova revisão e submetê-la novamente.</p>
                )}
            </div>
            <footer className="pdi-form-actions">
                <button type="button" className="pdi-form-button" disabled={enviando} onClick={fechar}>Fechar</button>
                <button type="button" className="pdi-form-button" disabled={enviando || carregando || sessaoExpirada}
                    onClick={consultarNovamente}>Consultar situação</button>
            </footer>
        </dialog>
    );
}
