import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { criarAcaoPdi, GravacaoAcaoNaoConfirmadaError } from '../services/acoesPdi';
import { ApiError } from '../services/http';
import { podeEditarRascunho } from '../services/pdis';
import type { AcaoPdiResponse, CriarAcaoPdiRequest } from '../types/acaoPdi';
import type { PdiRascunhoResponse } from '../types/pdi';
import './PdiFormulario.css';

type AcaoPdiFormularioProps = {
    pdi: PdiRascunhoResponse;
    onFechar: () => void;
    onSalvo: (acao: AcaoPdiResponse) => void;
    onSessaoExpirada: () => void;
};

type CamposFormulario = {
    titulo: string;
    objetivo: string;
    inicioPlanejado: string;
    fimPlanejado: string;
    resultadoEsperado: string;
};

type Bloqueio = 'nenhum' | 'conflito' | 'nao-confirmada' | 'indisponivel' | 'sessao';

const camposVazios: CamposFormulario = {
    titulo: '', objetivo: '', inicioPlanejado: '', fimPlanejado: '', resultadoEsperado: '',
};

function valorOpcional(value: string): string | null {
    return value === '' ? null : value;
}

function periodoInvalido(inicio: string | null, fim: string | null): boolean {
    if (!inicio || !fim) return false;
    // Comparar o calendário sem converter LocalDate para um fuso horário.
    const partesInicio = inicio.split('-').map(Number);
    const partesFim = fim.split('-').map(Number);
    for (let indice = 0; indice < 3; indice += 1) {
        if (partesInicio[indice] !== partesFim[indice]) {
            return partesInicio[indice] > partesFim[indice];
        }
    }
    return false;
}

function FormularioAberto({ pdi, onFechar, onSalvo, onSessaoExpirada }: AcaoPdiFormularioProps) {
    const identificador = useId();
    const tituloId = identificador + '-titulo';
    const descricaoId = identificador + '-descricao';
    const contextoId = identificador + '-contexto';
    const periodoErroId = identificador + '-periodo-erro';
    const dialogRef = useRef<HTMLDialogElement>(null);
    const cabecalhoRef = useRef<HTMLHeadingElement>(null);
    const tituloRef = useRef<HTMLInputElement>(null);
    const fimRef = useRef<HTMLInputElement>(null);
    const erroRef = useRef<HTMLDivElement>(null);
    const ativoRef = useRef(false);
    const enviandoRef = useRef(false);
    const bloqueadoRef = useRef(false);
    const gravacaoControllerRef = useRef<AbortController | null>(null);
    const callbacksRef = useRef({ onFechar, onSalvo, onSessaoExpirada });
    const [campos, setCampos] = useState<CamposFormulario>(camposVazios);
    const [bloqueio, setBloqueio] = useState<Bloqueio>('nenhum');
    const [enviando, setEnviando] = useState(false);
    const [erroEnvio, setErroEnvio] = useState<string | null>(null);
    const [erroPeriodo, setErroPeriodo] = useState(false);
    // Esta guarda orienta a interface. O servidor decide se a criação é permitida.
    const editavel = podeEditarRascunho(pdi);

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
        if (editavel) tituloRef.current?.focus();
    }, [editavel]);

    useEffect(() => {
        if (erroEnvio) erroRef.current?.focus();
    }, [erroEnvio]);

    function fechar() {
        if (ativoRef.current && !enviandoRef.current) callbacksRef.current.onFechar();
    }

    function alterarCampo(campo: keyof CamposFormulario, value: string) {
        setCampos((anteriores) => ({ ...anteriores, [campo]: value }));
        if (campo === 'inicioPlanejado' || campo === 'fimPlanejado') setErroPeriodo(false);
    }

    async function salvar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (enviandoRef.current || bloqueadoRef.current || !ativoRef.current
            || !editavel || bloqueio !== 'nenhum') return;

        const dados: CriarAcaoPdiRequest = {
            titulo: valorOpcional(campos.titulo),
            objetivo: valorOpcional(campos.objetivo),
            inicioPlanejado: valorOpcional(campos.inicioPlanejado),
            fimPlanejado: valorOpcional(campos.fimPlanejado),
            resultadoEsperado: valorOpcional(campos.resultadoEsperado),
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
        let acaoSalva: AcaoPdiResponse | null = null;

        try {
            const resposta = await criarAcaoPdi(pdi.id, pdi.versaoId, dados, controller.signal);
            if (!vigente()) return;
            acaoSalva = resposta;
        } catch (error: unknown) {
            if (!vigente()) return;
            if (error instanceof GravacaoAcaoNaoConfirmadaError) {
                bloqueadoRef.current = true;
                setBloqueio('nao-confirmada');
                setErroEnvio('Não foi possível confirmar se a ação foi salva. '
                    + 'Feche este formulário e confira a lista de ações antes de fazer um novo envio. '
                    + 'Seus campos foram mantidos e o envio está bloqueado neste formulário.');
            } else {
                const status = error instanceof ApiError ? error.status : null;
                if (status === 401) {
                    bloqueadoRef.current = true;
                    setBloqueio('sessao');
                    setErroEnvio('Sua sessão não está ativa. Entre novamente.');
                    callbacksRef.current.onSessaoExpirada();
                } else if (status === 403) {
                    setErroEnvio('Você não tem permissão para criar uma ação neste PDI. Seus campos foram mantidos.');
                } else if (status === 404) {
                    bloqueadoRef.current = true;
                    setBloqueio('indisponivel');
                    setErroEnvio('Este PDI ou esta versão não está disponível. '
                        + 'Feche este formulário para atualizar a lista de ações. Seus campos foram mantidos.');
                } else if (status === 409) {
                    bloqueadoRef.current = true;
                    setBloqueio('conflito');
                    setErroEnvio('Este PDI mudou ou não permite criar ações neste momento. '
                        + 'Feche este formulário para atualizar a lista de ações antes de fazer um novo envio. '
                        + 'Seus campos foram mantidos.');
                } else {
                    setErroEnvio(error instanceof ApiError
                        ? error.message
                        : 'Não foi possível salvar a ação. Seus campos foram mantidos. Tente novamente.');
                }
            }
        } finally {
            if (vigente() && !acaoSalva) {
                enviandoRef.current = false;
                setEnviando(false);
            }
            if (gravacaoControllerRef.current === controller) gravacaoControllerRef.current = null;
        }

        // O pai fecha o formulário e consulta a lista após a criação confirmada pelo serviço.
        if (acaoSalva && ativoRef.current && !controller.signal.aborted) {
            callbacksRef.current.onSalvo(acaoSalva);
        }
    }

    const camposSomenteLeitura = !editavel || bloqueio !== 'nenhum';
    const salvarDesabilitado = enviando || camposSomenteLeitura;

    return (
        <dialog
            ref={dialogRef}
            className="pdi-form-dialog"
            aria-labelledby={tituloId}
            aria-describedby={descricaoId + ' ' + contextoId}
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
                    Nova ação do PDI
                </h2>
                <p id={descricaoId} className="pdi-form-note">Todos os campos são opcionais.</p>
                <p id={contextoId} className="pdi-form-note">
                    PDI #{pdi.id}: {pdi.titulo || 'Sem título'} · Versão {pdi.numeroVersao}.
                </p>
            </header>

            <form className="pdi-form-content" onSubmit={salvar} aria-busy={enviando}>
                {erroEnvio && (
                    <div ref={erroRef} className="pdi-form-feedback pdi-form-error" role="alert" tabIndex={-1}>
                        <p>{erroEnvio}</p>
                    </div>
                )}

                {!editavel && (
                    <p className="pdi-form-feedback" role="status">
                        Este PDI está disponível para consulta e não permite criar ações neste momento.
                    </p>
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
                            disabled={enviando}
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
                            disabled={enviando}
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
                                disabled={enviando}
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
                                disabled={enviando}
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

                    <div className="pdi-form-field">
                        <label className="pdi-form-label" htmlFor={identificador + '-resultado'}>Resultado esperado</label>
                        <textarea
                            id={identificador + '-resultado'}
                            className="pdi-form-input pdi-form-textarea"
                            rows={5}
                            value={campos.resultadoEsperado}
                            onChange={(event) => alterarCampo('resultadoEsperado', event.target.value)}
                            disabled={enviando}
                            readOnly={camposSomenteLeitura}
                        />
                    </div>
                </div>

                <footer className="pdi-form-actions">
                    <button type="button" className="pdi-form-button" onClick={fechar} disabled={enviando}>
                        {bloqueio === 'nenhum' ? 'Cancelar' : 'Fechar'}
                    </button>
                    <button
                        type="submit"
                        className="pdi-form-button pdi-form-button-primary"
                        disabled={salvarDesabilitado}
                    >{enviando ? 'Salvando…' : 'Salvar ação'}</button>
                </footer>
            </form>
        </dialog>
    );
}

export default function AcaoPdiFormulario(props: AcaoPdiFormularioProps) {
    return <FormularioAberto key={props.pdi.id + '-' + props.pdi.versaoId} {...props} />;
}
