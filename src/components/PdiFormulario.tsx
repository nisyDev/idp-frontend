import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../services/http';
import {
    atualizarRascunho, buscarRascunho, criarRascunho,
    GravacaoPdiNaoConfirmadaError, podeEditarRascunho,
} from '../services/pdis';
import type { CriarPdiRequest, PdiRascunhoResponse } from '../types/pdi';
import './PdiFormulario.css';

type PdiFormularioProps = {
    onFechar: () => void;
    onSalvo: (pdi: PdiRascunhoResponse, modo: 'criacao' | 'edicao') => void;
    onSessaoExpirada: () => void;
} & ({ modo: 'criacao' } | { modo: 'edicao'; pdiId: number });

type CamposFormulario = {
    titulo: string;
    objetivo: string;
    inicioPlanejado: string;
    fimPlanejado: string;
};

type EstadoConsulta =
    | { tipo: 'carregando' }
    | { tipo: 'pronta' }
    | { tipo: 'erro'; mensagem: string; status: number | null };

type Bloqueio = 'nenhum' | 'nao-editavel' | 'conflito' | 'nao-confirmada' | 'indisponivel' | 'sessao';

const camposVazios: CamposFormulario = {
    titulo: '', objetivo: '', inicioPlanejado: '', fimPlanejado: '',
};

function valorOpcional(value: string): string | null {
    return value === '' ? null : value;
}

function periodoInvalido(inicio: string | null, fim: string | null): boolean {
    if (!inicio || !fim) return false;
    // Comparar as partes do calendário sem converter LocalDate para um fuso horário.
    const partesInicio = inicio.split('-').map(Number);
    const partesFim = fim.split('-').map(Number);
    for (let indice = 0; indice < 3; indice += 1) {
        if (partesInicio[indice] !== partesFim[indice]) {
            return partesInicio[indice] > partesFim[indice];
        }
    }
    return false;
}

function mensagemConsulta(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.status === 401) return 'Sua sessão não está ativa. Entre novamente.';
        if (error.status === 403) return 'Você não tem permissão para consultar este rascunho.';
        if (error.status === 404) return 'Este rascunho não está disponível.';
        return error.message;
    }
    return 'Não foi possível carregar o rascunho. Tente novamente.';
}

function FormularioAberto(props: PdiFormularioProps) {
    const { modo, onFechar, onSalvo, onSessaoExpirada } = props;
    const pdiId = props.modo === 'edicao' ? props.pdiId : null;
    const identificador = useId();
    const tituloId = identificador + '-titulo';
    const descricaoId = identificador + '-descricao';
    const periodoErroId = identificador + '-periodo-erro';
    const dialogRef = useRef<HTMLDialogElement>(null);
    const cabecalhoRef = useRef<HTMLHeadingElement>(null);
    const tituloRef = useRef<HTMLInputElement>(null);
    const fimRef = useRef<HTMLInputElement>(null);
    const erroRef = useRef<HTMLDivElement>(null);
    const ativoRef = useRef(false);
    const enviandoRef = useRef(false);
    const carregandoRef = useRef(pdiId !== null);
    const versaoEditadaRef = useRef<number | null>(null);
    const gravacaoControllerRef = useRef<AbortController | null>(null);
    const callbacksRef = useRef({ onFechar, onSalvo, onSessaoExpirada });
    const [campos, setCampos] = useState<CamposFormulario>(camposVazios);
    const [consulta, setConsulta] = useState<EstadoConsulta>(
        pdiId === null ? { tipo: 'pronta' } : { tipo: 'carregando' },
    );
    const [tentativaConsulta, setTentativaConsulta] = useState(0);
    const [editavel, setEditavel] = useState(pdiId === null);
    const [bloqueio, setBloqueio] = useState<Bloqueio>('nenhum');
    const [enviando, setEnviando] = useState(false);
    const [erroEnvio, setErroEnvio] = useState<string | null>(null);
    const [erroPeriodo, setErroPeriodo] = useState(false);

    useEffect(() => {
        callbacksRef.current = { onFechar, onSalvo, onSessaoExpirada };
    }, [onFechar, onSalvo, onSessaoExpirada]);

    useEffect(() => {
        const dialog = dialogRef.current;
        const focoAnterior = document.activeElement;
        ativoRef.current = true;
        dialog?.showModal();
        cabecalhoRef.current?.focus();

        return () => {
            ativoRef.current = false;
            gravacaoControllerRef.current?.abort();
            if (dialog?.open) dialog.close();
            if (focoAnterior instanceof HTMLElement && focoAnterior.isConnected) {
                focoAnterior.focus();
            }
        };
    }, []);

    useEffect(() => {
        if (pdiId === null) return;
        const controller = new AbortController();
        let ativo = true;
        const vigente = () => ativo && ativoRef.current && !controller.signal.aborted;
        carregandoRef.current = true;
        versaoEditadaRef.current = null;

        buscarRascunho(pdiId, controller.signal)
            .then((pdi) => {
                if (!vigente()) return;
                const permiteEdicao = podeEditarRascunho(pdi);
                versaoEditadaRef.current = pdi.versaoId;
                setCampos({
                    titulo: pdi.titulo ?? '',
                    objetivo: pdi.objetivo ?? '',
                    inicioPlanejado: pdi.inicioPlanejado ?? '',
                    fimPlanejado: pdi.fimPlanejado ?? '',
                });
                setEditavel(permiteEdicao);
                setBloqueio(permiteEdicao ? 'nenhum' : 'nao-editavel');
                setErroPeriodo(false);
                setConsulta({ tipo: 'pronta' });
            })
            .catch((error: unknown) => {
                if (!vigente()) return;
                const status = error instanceof ApiError ? error.status : null;
                setConsulta({ tipo: 'erro', status, mensagem: mensagemConsulta(error) });
                if (status === 404) setBloqueio('indisponivel');
                if (status === 401) {
                    setBloqueio('sessao');
                    callbacksRef.current.onSessaoExpirada();
                }
            })
            .finally(() => {
                if (vigente()) carregandoRef.current = false;
            });

        return () => {
            ativo = false;
            controller.abort();
        };
    }, [pdiId, tentativaConsulta]);

    const carregando = consulta.tipo === 'carregando';

    useEffect(() => {
        if (!carregando && editavel && consulta.tipo === 'pronta') tituloRef.current?.focus();
    }, [carregando, editavel, consulta.tipo]);

    useEffect(() => {
        if (erroEnvio) erroRef.current?.focus();
    }, [erroEnvio]);

    function fechar() {
        if (ativoRef.current && !enviandoRef.current) callbacksRef.current.onFechar();
    }

    function recarregar() {
        if (pdiId === null || enviandoRef.current || carregandoRef.current
            || bloqueio === 'nao-confirmada' || bloqueio === 'sessao') return;
        carregandoRef.current = true;
        setConsulta({ tipo: 'carregando' });
        setErroEnvio(null);
        setTentativaConsulta((value) => value + 1);
    }

    function alterarCampo(campo: keyof CamposFormulario, value: string) {
        setCampos((anteriores) => ({ ...anteriores, [campo]: value }));
        if (campo === 'inicioPlanejado' || campo === 'fimPlanejado') setErroPeriodo(false);
    }

    async function salvar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (enviandoRef.current || carregandoRef.current || !ativoRef.current
            || consulta.tipo !== 'pronta' || !editavel || bloqueio !== 'nenhum') return;
        const versaoId = versaoEditadaRef.current;
        if (pdiId !== null && versaoId === null) return;

        const dados: CriarPdiRequest = {
            titulo: valorOpcional(campos.titulo),
            objetivo: valorOpcional(campos.objetivo),
            inicioPlanejado: valorOpcional(campos.inicioPlanejado),
            fimPlanejado: valorOpcional(campos.fimPlanejado),
        };
        if (periodoInvalido(dados.inicioPlanejado, dados.fimPlanejado)) {
            setErroPeriodo(true);
            fimRef.current?.focus();
            return;
        }

        enviandoRef.current = true;
        setEnviando(true);
        setErroEnvio(null);
        const controller = new AbortController();
        gravacaoControllerRef.current = controller;
        const vigente = () => ativoRef.current && !controller.signal.aborted
            && gravacaoControllerRef.current === controller;
        let pdiSalvo: PdiRascunhoResponse | null = null;

        try {
            const resposta = pdiId === null
                ? await criarRascunho(dados, controller.signal)
                : await atualizarRascunho(pdiId, versaoId!, dados, controller.signal);
            if (!vigente()) return;
            pdiSalvo = resposta;
        } catch (error: unknown) {
            if (!vigente()) return;
            if (error instanceof GravacaoPdiNaoConfirmadaError) {
                setBloqueio('nao-confirmada');
                setErroEnvio('Não foi possível confirmar se o rascunho foi salvo. '
                    + 'Feche este formulário e confira a lista antes de fazer um novo envio. '
                    + 'Seus campos foram mantidos e o envio está bloqueado neste formulário.');
            } else {
                const status = error instanceof ApiError ? error.status : null;
                if (status === 401) {
                    setBloqueio('sessao');
                    setErroEnvio('Sua sessão não está ativa. Entre novamente.');
                    callbacksRef.current.onSessaoExpirada();
                } else if (status === 403) {
                    setErroEnvio('Você não tem permissão para salvar este rascunho. Seus campos foram mantidos.');
                } else if (status === 404) {
                    setBloqueio('indisponivel');
                    setErroEnvio('Este rascunho não está disponível. Seus campos foram mantidos.');
                } else if (status === 409) {
                    setBloqueio('conflito');
                    setErroEnvio(pdiId === null
                        ? 'Não foi possível criar o rascunho devido a um conflito. '
                            + 'Feche este formulário e confira a lista antes de fazer um novo envio. Seus campos foram mantidos.'
                        : 'Este rascunho mudou ou não pode mais ser editado. '
                            + 'Recarregue os dados para conferir antes de salvar novamente. Seus campos foram mantidos.');
                } else {
                    setErroEnvio(error instanceof ApiError
                        ? error.message
                        : 'Não foi possível salvar o rascunho. Seus campos foram mantidos. Tente novamente.');
                }
            }
        } finally {
            if (vigente() && !pdiSalvo) {
                enviandoRef.current = false;
                setEnviando(false);
            }
            if (gravacaoControllerRef.current === controller) gravacaoControllerRef.current = null;
        }

        // O pai fecha o formulário e atualiza a lista somente após uma gravação confirmada.
        if (pdiSalvo && ativoRef.current && !controller.signal.aborted) {
            callbacksRef.current.onSalvo(pdiSalvo, modo);
        }
    }

    const camposDesabilitados = carregando || enviando || consulta.tipo !== 'pronta';
    const camposSomenteLeitura = !editavel || bloqueio !== 'nenhum';
    const salvarDesabilitado = camposDesabilitados || camposSomenteLeitura;
    const podeReconsultar = pdiId !== null && bloqueio !== 'sessao' && bloqueio !== 'nao-confirmada';

    return (
        <dialog
            ref={dialogRef}
            className="pdi-form-dialog"
            aria-labelledby={tituloId}
            aria-describedby={descricaoId}
            onCancel={(event) => {
                event.preventDefault();
                fechar();
            }}
            onClose={(event) => {
                if (!ativoRef.current || event.currentTarget.open) return;
                if (enviandoRef.current) event.currentTarget.showModal();
                else fechar();
            }}
        >
            <header className="pdi-form-header">
                <h2 id={tituloId} ref={cabecalhoRef} className="pdi-form-title" tabIndex={-1}>
                    {modo === 'criacao' ? 'Novo rascunho de PDI' : 'Editar rascunho de PDI'}
                </h2>
                <p id={descricaoId} className="pdi-form-note">Todos os campos são opcionais.</p>
            </header>

            <form className="pdi-form-content" onSubmit={salvar} aria-busy={carregando || enviando}>
                {carregando && <p className="pdi-form-note" role="status">Carregando dados do rascunho…</p>}

                {consulta.tipo === 'erro' && (
                    <div className="pdi-form-feedback pdi-form-error" role="alert">
                        <p>{consulta.mensagem}</p>
                        {podeReconsultar && (
                            <>
                                <p className="pdi-form-note">
                                    Uma nova consulta substituirá as alterações não salvas neste formulário.
                                </p>
                                <button type="button" className="pdi-form-button" onClick={recarregar}>
                                    Tentar carregar novamente
                                </button>
                            </>
                        )}
                    </div>
                )}

                {erroEnvio && (
                    <div ref={erroRef} className="pdi-form-feedback pdi-form-error" role="alert" tabIndex={-1}>
                        <p>{erroEnvio}</p>
                    </div>
                )}

                {bloqueio === 'nao-editavel' && (
                    <p className="pdi-form-feedback" role="status">
                        Este rascunho está disponível para consulta e não pode ser editado.
                    </p>
                )}

                {pdiId !== null && bloqueio === 'conflito' && consulta.tipo !== 'erro' && (
                    <div className="pdi-form-feedback" role="status">
                        <p>Recarregar os dados substituirá as alterações não salvas neste formulário.</p>
                        <button
                            type="button"
                            className="pdi-form-button"
                            onClick={recarregar}
                            disabled={carregando || enviando}
                        >Recarregar dados do rascunho</button>
                    </div>
                )}

                <div className="pdi-form-fields">
                    <div className="pdi-form-field">
                        <label className="pdi-form-label" htmlFor={identificador + '-campo-titulo'}>Título</label>
                        <input
                            id={identificador + '-campo-titulo'}
                            ref={tituloRef}
                            className="pdi-form-input"
                            type="text"
                            value={campos.titulo}
                            onChange={(event) => alterarCampo('titulo', event.target.value)}
                            disabled={camposDesabilitados}
                            readOnly={camposSomenteLeitura}
                        />
                    </div>

                    <div className="pdi-form-field">
                        <label className="pdi-form-label" htmlFor={identificador + '-objetivo'}>Objetivo</label>
                        <textarea
                            id={identificador + '-objetivo'}
                            className="pdi-form-input pdi-form-textarea"
                            rows={5}
                            value={campos.objetivo}
                            onChange={(event) => alterarCampo('objetivo', event.target.value)}
                            disabled={camposDesabilitados}
                            readOnly={camposSomenteLeitura}
                        />
                    </div>

                    <div className="pdi-form-dates">
                        <div className="pdi-form-field">
                            <label className="pdi-form-label" htmlFor={identificador + '-inicio'}>Início planejado</label>
                            <input
                                id={identificador + '-inicio'}
                                className="pdi-form-input"
                                type="date"
                                value={campos.inicioPlanejado}
                                onChange={(event) => alterarCampo('inicioPlanejado', event.target.value)}
                                disabled={camposDesabilitados}
                                readOnly={camposSomenteLeitura}
                                aria-invalid={erroPeriodo || undefined}
                                aria-describedby={erroPeriodo ? periodoErroId : undefined}
                            />
                        </div>
                        <div className="pdi-form-field">
                            <label className="pdi-form-label" htmlFor={identificador + '-fim'}>Fim planejado</label>
                            <input
                                id={identificador + '-fim'}
                                ref={fimRef}
                                className="pdi-form-input"
                                type="date"
                                value={campos.fimPlanejado}
                                onChange={(event) => alterarCampo('fimPlanejado', event.target.value)}
                                disabled={camposDesabilitados}
                                readOnly={camposSomenteLeitura}
                                aria-invalid={erroPeriodo || undefined}
                                aria-describedby={erroPeriodo ? periodoErroId : undefined}
                            />
                        </div>
                    </div>
                    {erroPeriodo && (
                        <p id={periodoErroId} className="pdi-form-date-error" role="alert">
                            O início planejado deve ser anterior ou igual ao fim planejado.
                        </p>
                    )}
                </div>

                <footer className="pdi-form-actions">
                    <button type="button" className="pdi-form-button" onClick={fechar} disabled={enviando}>
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="pdi-form-button pdi-form-button-primary"
                        disabled={salvarDesabilitado}
                    >{enviando ? 'Salvando…' : 'Salvar rascunho'}</button>
                </footer>
            </form>
        </dialog>
    );
}

export default function PdiFormulario(props: PdiFormularioProps) {
    return (
        <FormularioAberto
            key={props.modo === 'edicao' ? 'edicao-' + props.pdiId : 'criacao'}
            {...props}
        />
    );
}
