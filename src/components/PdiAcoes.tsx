import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ApiError } from '../services/http';
import { GravacaoAcaoNaoConfirmadaError, listarAcoesPdi, removerAcaoPdi } from '../services/acoesPdi';
import { podeEditarRascunho } from '../services/pdis';
import type { AcaoPdiResponse } from '../types/acaoPdi';
import type { PdiRascunhoResponse } from '../types/pdi';
import AcaoPdiFormulario from './AcaoPdiFormulario';
import './PdiAcoes.css';
import './PdiFormulario.css';

type PdiAcoesProps = {
    bloqueado: boolean;
    onSessaoExpirada: () => void;
    onOcupadoChange?: (ocupado: boolean) => void;
} & (
    | { somenteLeitura: true; pdi: Pick<PdiRascunhoResponse, 'id' | 'versaoId'> }
    | { somenteLeitura?: false; pdi: PdiRascunhoResponse }
);
type EditorAcao = { modo: 'criacao' } | { modo: 'edicao'; acao: AcaoPdiResponse };
type EstadoAcoes =
    | { tipo: 'carregando'; acoes: AcaoPdiResponse[] | null }
    | { tipo: 'sucesso'; acoes: AcaoPdiResponse[] }
    | { tipo: 'erro'; acoes: AcaoPdiResponse[] | null; status: number | null; mensagem: string };

const execucao: Record<AcaoPdiResponse['statusExecucao'], string> = {
    NAO_INICIADA: 'Não iniciada', EM_EXECUCAO: 'Em execução', CONCLUIDA: 'Concluída',
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

function ConfirmarRemocao({ acao, onFechar, onRemovida, onSessaoExpirada }: {
    acao: AcaoPdiResponse;
    onFechar: () => void;
    onRemovida: () => void;
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
        ativo.current = true;
        const elemento = dialog.current;
        const focoAnterior = document.activeElement;
        elemento?.showModal();
        return () => {
            ativo.current = false;
            controller.current?.abort();
            if (elemento?.open) elemento.close();
            if (focoAnterior instanceof HTMLElement && focoAnterior.isConnected) focoAnterior.focus();
        };
    }, []);

    async function confirmar() {
        if (emEnvio.current || bloqueioRef.current || !ativo.current) return;
        emEnvio.current = true;
        setEnviando(true);
        setErro('');
        const requisicao = new AbortController();
        controller.current = requisicao;
        let concluida = false;
        try {
            await removerAcaoPdi(acao.pdiId, acao.pdiVersaoId, acao.id, requisicao.signal);
            if (!ativo.current || requisicao.signal.aborted) return;
            concluida = true;
        } catch (error) {
            if (!ativo.current || requisicao.signal.aborted) return;
            const status = error instanceof ApiError ? error.status : null;
            if (error instanceof GravacaoAcaoNaoConfirmadaError) {
                bloqueioRef.current = true;
                setBloqueada(true);
                setErro('Não foi possível confirmar a remoção. A ação exibida foi mantida. '
                    + 'Feche esta confirmação e confira as ações antes de fazer outra operação.');
            } else {
                if (status === 401) onSessaoExpirada();
                if (status === 401 || status === 403 || status === 404 || status === 409) {
                    bloqueioRef.current = true;
                    setBloqueada(true);
                }
                setErro(status === 409 ? 'A versão mudou ou não permite remoção. Feche e atualize as ações.'
                    : error instanceof ApiError ? error.message : 'Não foi possível remover a ação.');
            }
        } finally {
            if (ativo.current) {
                emEnvio.current = false;
                setEnviando(false);
            }
            controller.current = null;
        }
        if (concluida && ativo.current) onRemovida();
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
            <header className="pdi-form-header"><h2 id={tituloId} className="pdi-form-title">Remover ação</h2></header>
            <div className="pdi-form-content" aria-busy={enviando}>
                <p>Remover “{acao.titulo?.trim() || 'Ação sem título'}” deste rascunho?</p>
                <p className="pdi-form-note">As versões anteriores e seu histórico serão preservados.</p>
                {erro && <p className="pdi-form-feedback pdi-form-error" role="alert">{erro}</p>}
                <footer className="pdi-form-actions">
                    <button type="button" className="pdi-form-button" onClick={fechar} disabled={enviando}>Fechar</button>
                    <button type="button" className="pdi-form-button pdi-form-button-primary"
                        onClick={() => void confirmar()} disabled={enviando || bloqueada}>
                        {enviando ? 'Removendo…' : 'Confirmar remoção'}
                    </button>
                </footer>
            </div>
        </dialog>
    );
}

export default function PdiAcoes(props: PdiAcoesProps) {
    const { pdi, bloqueado, onSessaoExpirada, onOcupadoChange } = props;
    const pdiEditavel: PdiRascunhoResponse | null = props.somenteLeitura !== true
        && 'numeroVersao' in props.pdi ? props.pdi : null;
    const permitido = pdiEditavel !== null && podeEditarRascunho(pdiEditavel);
    const tituloId = useId();
    const [consulta, setConsulta] = useState<EstadoAcoes>({ tipo: 'carregando', acoes: null });
    const [atualizacao, setAtualizacao] = useState(0);
    const [editor, setEditor] = useState<EditorAcao | null>(null);
    const [remocao, setRemocao] = useState<AcaoPdiResponse | null>(null);
    const [confirmacao, setConfirmacao] = useState('');
    const geracao = useRef(0);
    const contexto = useRef(pdi.id + ':' + pdi.versaoId);
    const ocupado = editor !== null || remocao !== null;

    useEffect(() => {
        onOcupadoChange?.(ocupado);
        return () => onOcupadoChange?.(false);
    }, [ocupado, onOcupadoChange]);

    useEffect(() => {
        const controller = new AbortController();
        const atual = ++geracao.current;
        let ativo = true;
        const vigente = () => ativo && !controller.signal.aborted && geracao.current === atual;
        const chave = pdi.id + ':' + pdi.versaoId;
        const mudouVersao = contexto.current !== chave;
        contexto.current = chave;
        setConsulta((anterior) => ({ tipo: 'carregando', acoes: mudouVersao ? null : anterior.acoes }));
        listarAcoesPdi(pdi.id, pdi.versaoId, controller.signal)
            .then((acoes) => { if (vigente()) setConsulta({ tipo: 'sucesso', acoes }); })
            .catch((error: unknown) => {
                if (!vigente()) return;
                const status = error instanceof ApiError ? error.status : null;
                setConsulta((anterior) => ({
                    tipo: 'erro', status,
                    acoes: status === 401 || status === 403 || status === 404 || status === 409 ? null : anterior.acoes,
                    mensagem: error instanceof ApiError ? error.message : 'Não foi possível consultar as ações.',
                }));
                if (status === 401) onSessaoExpirada();
            });
        return () => { ativo = false; controller.abort(); };
    }, [pdi.id, pdi.versaoId, atualizacao, onSessaoExpirada]);

    const atualizar = useCallback(() => {
        geracao.current += 1;
        setConsulta((anterior) => ({ tipo: 'carregando', acoes: anterior.acoes }));
        setAtualizacao((value) => value + 1);
    }, []);
    const fecharFormulario = useCallback(() => { setEditor(null); atualizar(); }, [atualizar]);
    const fecharRemocao = useCallback(() => { setRemocao(null); atualizar(); }, [atualizar]);
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
    const aoRemover = useCallback(() => {
        setConfirmacao('Ação removida deste rascunho com sucesso.');
        setRemocao(null);
        atualizar();
    }, [atualizar]);
    const acoes = consulta.acoes;
    const carregando = consulta.tipo === 'carregando';
    const sessaoExpirada = consulta.tipo === 'erro' && consulta.status === 401;
    const escritaBloqueada = bloqueado || !permitido || consulta.tipo !== 'sucesso' || ocupado;

    return (
        <section className="pdi-acoes" aria-labelledby={tituloId}>
            <header className="pdi-acoes-header">
                <div className="pdi-acoes-heading">
                    <h3 id={tituloId}>Ações do PDI</h3>
                    {acoes !== null && <span className="pdi-real-badge">{acoes.length} {acoes.length === 1 ? 'ação' : 'ações'}</span>}
                </div>
                <div className="pdi-acoes-toolbar">
                    <button type="button" className="pdi-real-button" onClick={atualizar}
                        disabled={bloqueado || carregando || ocupado || sessaoExpirada}>Atualizar ações</button>
                    {permitido && <button type="button" className="pdi-real-button pdi-real-button-primary"
                        onClick={() => { if (!escritaBloqueada) { setConfirmacao(''); setEditor({ modo: 'criacao' }); } }}
                        disabled={escritaBloqueada}><span aria-hidden="true">+</span> Nova ação</button>}
                </div>
            </header>
            {confirmacao && <p className="pdi-acoes-confirmation" role="status">{confirmacao}</p>}
            {carregando && <p className="pdi-acoes-note" role="status" aria-busy="true">Carregando as ações desta versão…</p>}
            {consulta.tipo === 'erro' && <div className="pdi-acoes-error" role="alert">
                <p>{consulta.mensagem}</p>
                {acoes !== null && <p>As ações já carregadas foram mantidas.</p>}
                {!sessaoExpirada && <button type="button" className="pdi-real-button" onClick={atualizar}
                    disabled={bloqueado || ocupado}>Tentar novamente</button>}
            </div>}
            {acoes !== null && (acoes.length === 0
                ? <p className="pdi-acoes-note" role="status">Esta versão não possui ações ativas.
                    {permitido && consulta.tipo === 'sucesso' && ' Use “Nova ação” para cadastrar a primeira.'}</p>
                : <div className="pdi-acoes-list">{acoes.map((acao) => (
                    <article key={acao.acaoVersaoId} className="pdi-acoes-card" aria-labelledby={'acao-pdi-title-' + acao.acaoVersaoId}>
                        <div className="pdi-acoes-card-header">
                            <h4 id={'acao-pdi-title-' + acao.acaoVersaoId}>{acao.titulo?.trim() || 'Título não informado'}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span className="pdi-real-badge">{execucao[acao.statusExecucao]}</span>
                                {permitido && <>
                                    <button type="button" className="pdi-real-button pdi-real-button-compact"
                                        onClick={() => { if (!escritaBloqueada) { setConfirmacao(''); setEditor({ modo: 'edicao', acao }); } }}
                                        disabled={escritaBloqueada} aria-label={'Editar ação ' + (acao.titulo?.trim() || '#' + acao.id)}>Editar</button>
                                    <button type="button" className="pdi-real-button pdi-real-button-compact"
                                        onClick={() => { if (!escritaBloqueada) { setConfirmacao(''); setRemocao(acao); } }}
                                        disabled={escritaBloqueada} aria-label={'Remover ação ' + (acao.titulo?.trim() || '#' + acao.id)}>Remover</button>
                                </>}
                            </div>
                        </div>
                        <dl className="pdi-acoes-fields">
                            <div><dt>Objetivo</dt><dd>{acao.objetivo?.trim() || 'Objetivo não informado.'}</dd></div>
                            <div><dt>Resultado esperado</dt><dd>{acao.resultadoEsperado?.trim() || 'Resultado esperado não informado.'}</dd></div>
                            <div className="pdi-acoes-period"><dt>Período planejado</dt><dd>{periodoPlanejado(acao)}</dd></div>
                        </dl>
                    </article>
                ))}</div>)}
            {permitido && pdiEditavel && editor !== null && <AcaoPdiFormulario
                key={editor.modo === 'edicao' ? 'editar-' + editor.acao.id : 'criar'}
                pdi={pdiEditavel} acao={editor.modo === 'edicao' ? editor.acao : undefined}
                onFechar={fecharFormulario} onSalvo={aoSalvar} onSessaoExpirada={onSessaoExpirada} />}
            {permitido && remocao && <ConfirmarRemocao acao={remocao}
                onFechar={fecharRemocao} onRemovida={aoRemover} onSessaoExpirada={onSessaoExpirada} />}
        </section>
    );
}
