import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ApiError } from '../services/http';
import type { UsuarioAutenticado } from '../services/auth';
import { GravacaoPdiNaoConfirmadaError, listarRascunhos, podeEditarRascunho, submeterPdi } from '../services/pdis';
import type { PdiRascunhoResponse, PdiSubmetidoResponse, StatusAprovacaoPdi, StatusExecucaoPdi } from '../types/pdi';
import PdiFormulario from './PdiFormulario';
import PdiAcoes from './PdiAcoes';
import './PdiRascunhosReais.css';
import './PdiFormulario.css';

type EstadoConsulta =
    | { tipo: 'carregando'; pdis: PdiRascunhoResponse[] | null }
    | { tipo: 'sucesso'; pdis: PdiRascunhoResponse[] }
    | { tipo: 'erro'; pdis: PdiRascunhoResponse[] | null; mensagem: string; status: number | null };

type EditorRascunho = { modo: 'criacao' } | { modo: 'edicao'; pdiId: number };

interface PdiRascunhosReaisProps {
    usuario: UsuarioAutenticado;
    onSessaoExpirada: (usuarioId: string) => void;
}

const execucao: Record<StatusExecucaoPdi, string> = {
    NAO_INICIADO: 'Não iniciado',
    EM_EXECUCAO: 'Em execução',
    CONCLUIDO: 'Concluído',
};

const aprovacao: Record<StatusAprovacaoPdi, string> = {
    RASCUNHO: 'Rascunho',
    AGUARDANDO_APROVACAO: 'Aguardando aprovação',
    APROVADO: 'Aprovado',
    REPROVADO: 'Reprovado',
    RETIRADA: 'Retirada',
};

function dataPlanejada(value: string | null | undefined): string {
    if (!value) return 'Não informado';
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    // LocalDate é uma data de calendário; não converter para UTC.
    return partes ? partes[3] + '/' + partes[2] + '/' + partes[1] : 'Data indisponível';
}

function periodoPlanejado(pdi: PdiRascunhoResponse): string {
    if (pdi.inicioPlanejado && pdi.fimPlanejado) {
        return dataPlanejada(pdi.inicioPlanejado) + ' a ' + dataPlanejada(pdi.fimPlanejado);
    }
    if (pdi.inicioPlanejado) return 'Início planejado: ' + dataPlanejada(pdi.inicioPlanejado);
    if (pdi.fimPlanejado) return 'Fim planejado: ' + dataPlanejada(pdi.fimPlanejado);
    return 'Período planejado não informado';
}

function dataHora(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? 'Data indisponível'
        : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function Mensagem({
    titulo, children, erro = false, carregando = false,
}: { titulo: string; children: ReactNode; erro?: boolean; carregando?: boolean }) {
    return (
        <section
            className={'pdi-real-feedback' + (erro ? ' pdi-real-feedback-error' : '')}
            role={erro ? 'alert' : 'status'}
            aria-busy={carregando}
        >
            {carregando && <span className="pdi-real-spinner" aria-hidden="true" />}
            <h2>{titulo}</h2>
            <div className="pdi-real-muted">{children}</div>
        </section>
    );
}

function ConfirmarSubmissao({ pdi, onFechar, onSubmetido, onSessaoExpirada }: {
    pdi: PdiRascunhoResponse;
    onFechar: () => void;
    onSubmetido: (pdi: PdiSubmetidoResponse) => void;
    onSessaoExpirada: () => void;
}) {
    const dialog = useRef<HTMLDialogElement>(null);
    const tituloId = useId();
    const ativo = useRef(false);
    const emEnvio = useRef(false);
    const bloqueioRef = useRef(false);
    const controller = useRef<AbortController | null>(null);
    const [enviando, setEnviando] = useState(false);
    const [bloqueada, setBloqueada] = useState(false);
    const [erro, setErro] = useState('');
    useEffect(() => {
        const elemento = dialog.current;
        const focoAnterior = document.activeElement;
        ativo.current = true;
        elemento?.showModal();
        return () => {
            ativo.current = false;
            controller.current?.abort();
            if (elemento?.open) elemento.close();
            if (focoAnterior instanceof HTMLElement && focoAnterior.isConnected) focoAnterior.focus();
        };
    }, []);
    async function confirmar() {
        if (!ativo.current || emEnvio.current || bloqueioRef.current) return;
        emEnvio.current = true;
        setEnviando(true);
        setErro('');
        const requisicao = new AbortController();
        controller.current = requisicao;
        let resultado: PdiSubmetidoResponse | null = null;
        try {
            resultado = await submeterPdi(pdi.id, pdi.versaoId, requisicao.signal);
            if (!ativo.current || requisicao.signal.aborted) resultado = null;
        } catch (error) {
            if (!ativo.current || requisicao.signal.aborted) return;
            if (error instanceof GravacaoPdiNaoConfirmadaError) {
                bloqueioRef.current = true;
                setBloqueada(true);
                setErro('Não foi possível confirmar a submissão. O PDI exibido foi mantido e um novo envio está bloqueado. '
                    + 'Feche esta confirmação e confira os rascunhos e as versões submetidas.');
            } else {
                const status = error instanceof ApiError ? error.status : null;
                if (status === 401) onSessaoExpirada();
                if (status === 401 || status === 403 || status === 404 || status === 409) {
                    bloqueioRef.current = true;
                    setBloqueada(true);
                }
                setErro(status === 409
                    ? 'Esta versão mudou, já foi submetida ou não atende às condições para submissão. '
                        + 'Confira se há uma ação ativa e um gestor ativo; feche e atualize os dados.'
                    : error instanceof ApiError ? error.message : 'Não foi possível submeter o PDI.');
            }
        } finally {
            if (ativo.current) {
                emEnvio.current = false;
                setEnviando(false);
            }
            controller.current = null;
        }
        if (resultado && ativo.current) onSubmetido(resultado);
    }
    function fechar() { if (!emEnvio.current) onFechar(); }
    return (
        <dialog ref={dialog} className="pdi-form-dialog" aria-labelledby={tituloId}
            onCancel={(event) => { event.preventDefault(); fechar(); }}
            onClose={(event) => {
                if (!ativo.current || event.currentTarget.open) return;
                if (emEnvio.current) event.currentTarget.showModal();
                else fechar();
            }}>
            <header className="pdi-form-header"><h2 id={tituloId} className="pdi-form-title">Submeter PDI para aprovação</h2></header>
            <div className="pdi-form-content" aria-busy={enviando}>
                <p>Enviar “{pdi.titulo?.trim() || 'PDI sem título'}”, versão {pdi.numeroVersao}, ao gestor responsável?</p>
                <p className="pdi-form-note">A versão submetida ficará disponível para consulta. A edição será bloqueada enquanto aguarda decisão.</p>
                {erro && <p className="pdi-form-feedback pdi-form-error" role="alert">{erro}</p>}
                <footer className="pdi-form-actions">
                    <button type="button" className="pdi-form-button" onClick={fechar} disabled={enviando}>Fechar</button>
                    <button type="button" className="pdi-form-button pdi-form-button-primary"
                        onClick={() => void confirmar()} disabled={enviando || bloqueada}>
                        {enviando ? 'Enviando…' : 'Confirmar submissão'}
                    </button>
                </footer>
            </div>
        </dialog>
    );
}

function CartaoRascunho({
    pdi, nomeUsuario, onEditar, edicaoBloqueada, onSessaoExpirada, onSubmetido, onAtualizar,
}: {
    pdi: PdiRascunhoResponse;
    nomeUsuario: string;
    onEditar: (id: number) => void;
    edicaoBloqueada: boolean;
    onSessaoExpirada: () => void;
    onSubmetido: (pdi: PdiSubmetidoResponse) => void;
    onAtualizar: () => void;
}) {
    const [aberto, setAberto] = useState(false);
    const [acoesOcupadas, setAcoesOcupadas] = useState(false);
    const [submissaoAberta, setSubmissaoAberta] = useState(false);
    const operacaoBloqueada = edicaoBloqueada || acoesOcupadas || submissaoAberta;
    const iniciais = nomeUsuario.trim().split(/\s+/)
        .map((parte) => parte.charAt(0)).join('').slice(0, 2).toUpperCase();
    const titulo = pdi.titulo?.trim() || 'Título não informado';
    const detalhesId = 'pdi-real-details-' + pdi.id;

    return (
        <article className="pdi-real-card" aria-labelledby={'pdi-real-title-' + pdi.id}>
            <div className="pdi-real-card-header">
                <div className="pdi-real-avatar" aria-hidden="true">{iniciais}</div>
                <div className="pdi-real-card-overview">
                    <div className="pdi-real-card-top">
                        <h2 id={'pdi-real-title-' + pdi.id}>{titulo}</h2>
                        <span className="pdi-real-badge">{aprovacao[pdi.statusAprovacao]}</span>
                    </div>
                    <p className="pdi-real-owner">{nomeUsuario}</p>
                    <p className="pdi-real-period">{periodoPlanejado(pdi)}</p>
                </div>
                <button
                    type="button"
                    className="pdi-real-expand"
                    disabled={acoesOcupadas || submissaoAberta}
                    onClick={() => setAberto((value) => !value)}
                    aria-expanded={aberto}
                    aria-controls={detalhesId}
                    aria-label={(aberto ? 'Recolher detalhes de ' : 'Expandir detalhes de ') + titulo}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                        strokeLinejoin="round" aria-hidden="true" focusable="false">
                        <polyline points={aberto ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
                    </svg>
                </button>
            </div>

            <div className="pdi-real-card-summary">
                <span className="pdi-real-badge">{execucao[pdi.statusExecucao]}</span>
                <span className="pdi-real-muted">Versão em elaboração: {pdi.numeroVersao}</span>
                {podeEditarRascunho(pdi) && (
                    <button
                        type="button"
                        className="pdi-real-button pdi-real-button-compact"
                        onClick={() => onEditar(pdi.id)}
                        disabled={operacaoBloqueada}
                        aria-label={'Editar ' + titulo}
                    >Editar</button>
                )}
                {podeEditarRascunho(pdi) && (
                    <button type="button" className="pdi-real-button pdi-real-button-compact"
                        onClick={() => { if (!operacaoBloqueada) setSubmissaoAberta(true); }}
                        disabled={operacaoBloqueada} aria-label={'Submeter ' + titulo}>Submeter</button>
                )}
            </div>
            <p className="pdi-real-objective">{pdi.objetivo?.trim() || 'Objetivo não informado.'}</p>

            <div id={detalhesId} hidden={!aberto}>
                {aberto && (
                    <div className="pdi-real-details">
                        <dl className="pdi-real-metadata">
                            <div><dt>Início planejado</dt><dd>{dataPlanejada(pdi.inicioPlanejado)}</dd></div>
                            <div><dt>Fim planejado</dt><dd>{dataPlanejada(pdi.fimPlanejado)}</dd></div>
                            <div><dt>PDI criado em</dt><dd>{dataHora(pdi.criadoEm)}</dd></div>
                            <div><dt>Versão criada em</dt><dd>{dataHora(pdi.versaoCriadaEm)}</dd></div>
                        </dl>
                        <PdiAcoes
                            key={pdi.id + '-' + pdi.versaoId}
                            pdi={pdi}
                            bloqueado={edicaoBloqueada || submissaoAberta}
                            onSessaoExpirada={onSessaoExpirada}
                            onOcupadoChange={setAcoesOcupadas}
                        />
                    </div>
                )}
            </div>
            {submissaoAberta && <ConfirmarSubmissao pdi={pdi} onSessaoExpirada={onSessaoExpirada}
                onSubmetido={onSubmetido} onFechar={() => { setSubmissaoAberta(false); onAtualizar(); }} />}
        </article>
    );
}

function ConsultaRascunhos({
    usuario, onSessaoExpirada,
}: PdiRascunhosReaisProps) {
    const { theme } = useTheme();
    const [consulta, setConsulta] = useState<EstadoConsulta>({ tipo: 'carregando', pdis: null });
    const [atualizacao, setAtualizacao] = useState(0);
    const [editor, setEditor] = useState<EditorRascunho | null>(null);
    const [confirmacao, setConfirmacao] = useState('');
    const geracaoConsulta = useRef(0);
    const sessaoExpiradaRef = useRef(onSessaoExpirada);

    useEffect(() => {
        sessaoExpiradaRef.current = onSessaoExpirada;
    }, [onSessaoExpirada]);

    useEffect(() => {
        const controller = new AbortController();
        const atual = ++geracaoConsulta.current;
        let ativo = true;
        const vigente = () => ativo && !controller.signal.aborted && atual === geracaoConsulta.current;

        listarRascunhos(controller.signal)
            .then((pdis) => {
                if (vigente()) setConsulta({ tipo: 'sucesso', pdis });
            })
            .catch((error: unknown) => {
                if (!vigente()) return;
                const status = error instanceof ApiError ? error.status : null;
                setConsulta((anterior) => ({
                    tipo: 'erro', status,
                    pdis: status === 401 || status === 403 ? null : anterior.pdis,
                    mensagem: error instanceof ApiError
                        ? error.message
                        : 'Não foi possível consultar os rascunhos. Tente novamente.',
                }));
                if (status === 401) sessaoExpiradaRef.current(usuario.id);
            });

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [usuario.id, atualizacao]);

    function atualizar() {
        geracaoConsulta.current += 1;
        setConsulta((anterior) => ({ tipo: 'carregando', pdis: anterior.pdis }));
        setAtualizacao((value) => value + 1);
    }

    function abrirNovo() {
        setConfirmacao('');
        setEditor({ modo: 'criacao' });
    }

    function abrirEdicao(id: number) {
        setConfirmacao('');
        setEditor({ modo: 'edicao', pdiId: id });
    }

    const fecharFormulario = useCallback(() => {
        setEditor(null);
        geracaoConsulta.current += 1;
        setConsulta((anterior) => ({ tipo: 'carregando', pdis: anterior.pdis }));
        setAtualizacao((value) => value + 1);
    }, []);
    const sessaoFormularioExpirada = useCallback(() => {
        onSessaoExpirada(usuario.id);
    }, [onSessaoExpirada, usuario.id]);

    const aoSalvar = useCallback((pdi: PdiRascunhoResponse, modo: 'criacao' | 'edicao') => {
        // Only the confirmed server DTO updates the cards. Invalidate older list responses.
        geracaoConsulta.current += 1;
        setEditor(null);
        setConfirmacao(modo === 'criacao' ? 'PDI criado com sucesso.' : 'Rascunho atualizado com sucesso.');
        setConsulta((anterior) => {
            if (!anterior.pdis) return { tipo: 'carregando', pdis: null };
            const presente = anterior.pdis.some((item) => item.id === pdi.id);
            return {
                tipo: 'carregando',
                pdis: presente ? anterior.pdis.map((item) => item.id === pdi.id ? pdi : item)
                    : [pdi, ...anterior.pdis],
            };
        });
        setAtualizacao((value) => value + 1);
    }, []);

    const aoSubmeter = useCallback((submetido: PdiSubmetidoResponse) => {
        // Remove only the exact version whose submission the server confirmed.
        geracaoConsulta.current += 1;
        setConsulta((anterior) => anterior.pdis === null ? { tipo: 'carregando', pdis: null } : {
            tipo: 'carregando',
            pdis: anterior.pdis.filter((item) => item.id !== submetido.id || item.versaoId !== submetido.versaoId),
        });
        setConfirmacao('Versão ' + submetido.numero + ' submetida com sucesso. '
            + 'Consulte as versões submetidas para acompanhar a decisão.');
        setAtualizacao((value) => value + 1);
    }, []);

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
    const pdis = consulta.pdis;
    const carregando = consulta.tipo === 'carregando';
    const sessaoExpirada = consulta.tipo === 'erro' && consulta.status === 401;
    const acessoNegado = consulta.tipo === 'erro' && consulta.status === 403;

    return (
        <section className="pdi-real" style={cores} aria-labelledby="pdi-real-heading" aria-busy={carregando}>
            <header className="pdi-real-heading">
                <div>
                    <h1 id="pdi-real-heading">Planos de Desenvolvimento Individual</h1>
                    <p className="pdi-real-muted">Consulte seus rascunhos e os dados planejados do seu desenvolvimento.</p>
                </div>
                <div className="pdi-real-toolbar">
                    <button
                        type="button"
                        className="pdi-real-button pdi-real-button-primary"
                        onClick={abrirNovo}
                        disabled={editor !== null || sessaoExpirada || acessoNegado}
                    ><span aria-hidden="true">+</span> Novo PDI</button>
                    <button
                        type="button"
                        className="pdi-real-button"
                        onClick={atualizar}
                        disabled={carregando || sessaoExpirada || editor !== null}
                    >Atualizar lista</button>
                    {pdis && (
                        <>
                            <div className="pdi-real-stat" role="status">
                                <strong>{pdis.length}</strong> {pdis.length === 1 ? 'PDI' : 'PDIs'}
                            </div>
                            <div className="pdi-real-stat">
                                <strong>{pdis.filter((pdi) => pdi.statusExecucao === 'EM_EXECUCAO').length}</strong> em execução
                            </div>
                        </>
                    )}
                </div>
            </header>

            {confirmacao && <p className="pdi-real-confirmation" role="status">{confirmacao}</p>}

            {carregando && (
                <Mensagem titulo={pdis === null ? 'Carregando seus rascunhos' : 'Atualizando seus rascunhos'} carregando>
                    <p>Aguarde um instante.</p>
                </Mensagem>
            )}

            {consulta.tipo === 'erro' && (
                <Mensagem
                    erro
                    titulo={sessaoExpirada ? 'Sua sessão foi encerrada'
                        : consulta.status === 403 ? 'Consulta não autorizada'
                            : 'Não foi possível carregar os rascunhos'}
                >
                    <p>{consulta.mensagem}</p>
                    {pdis !== null && <p>Os dados já carregados foram mantidos.</p>}
                    {!sessaoExpirada && (
                        <button type="button" className="pdi-real-button" onClick={atualizar}>
                            Tentar novamente
                        </button>
                    )}
                </Mensagem>
            )}

            {pdis && (pdis.length === 0 ? (
                <Mensagem titulo="Nenhum rascunho encontrado">
                    <p>Você ainda não possui rascunhos disponíveis para consulta.</p>
                </Mensagem>
            ) : (
                <div className="pdi-real-list">
                    {pdis.map((pdi) => (
                        <CartaoRascunho
                            key={pdi.id + '-' + pdi.versaoId}
                            pdi={pdi}
                            nomeUsuario={usuario.nome}
                            onEditar={abrirEdicao}
                            edicaoBloqueada={consulta.tipo !== 'sucesso' || editor !== null || sessaoExpirada || acessoNegado}
                            onSessaoExpirada={sessaoFormularioExpirada}
                            onSubmetido={aoSubmeter}
                            onAtualizar={atualizar}
                        />
                    ))}
                </div>
            ))}
            {editor && (
                <PdiFormulario
                    key={editor.modo === 'criacao' ? 'criacao' : 'edicao-' + editor.pdiId}
                    {...editor}
                    onFechar={fecharFormulario}
                    onSalvo={aoSalvar}
                    onSessaoExpirada={sessaoFormularioExpirada}
                />
            )}
        </section>
    );
}

export default function PdiRascunhosReais(props: PdiRascunhosReaisProps) {
    return <ConsultaRascunhos key={props.usuario.id} {...props} />;
}
