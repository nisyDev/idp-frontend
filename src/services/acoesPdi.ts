import { STATUS_EXECUCAO_ACAO_PDI } from '../types/acaoPdi';
import type { AcaoPdiResponse, AtualizarAcaoPdiRequest, CriarAcaoPdiRequest } from '../types/acaoPdi';
import { obterCsrf } from './auth';
import { ApiError, requisitarApiComSessao } from './http';

export class GravacaoAcaoNaoConfirmadaError extends ApiError {
    constructor(status: number | null = null) {
        super('Não foi possível confirmar a gravação da ação. Confira a listagem antes de enviar novamente.', status);
        this.name = 'GravacaoAcaoNaoConfirmadaError';
    }
}

function inteiroPositivo(value: unknown): value is number {
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function textoOuNulo(value: unknown): boolean {
    return value === null || typeof value === 'string';
}

function acaoValida(value: unknown): value is AcaoPdiResponse {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
    const acao = value as Record<string, unknown>;
    return (
        inteiroPositivo(acao.id) &&
        inteiroPositivo(acao.acaoVersaoId) &&
        inteiroPositivo(acao.pdiId) &&
        inteiroPositivo(acao.pdiVersaoId) &&
        textoOuNulo(acao.titulo) &&
        textoOuNulo(acao.objetivo) &&
        textoOuNulo(acao.resultadoEsperado) &&
        textoOuNulo(acao.inicioPlanejado) &&
        textoOuNulo(acao.fimPlanejado) &&
        typeof acao.ordem === 'number' && Number.isInteger(acao.ordem) &&
        STATUS_EXECUCAO_ACAO_PDI.some((status) => status === acao.statusExecucao)
    );
}

function copiarAcao(acao: AcaoPdiResponse): AcaoPdiResponse {
    return {
        id: acao.id,
        acaoVersaoId: acao.acaoVersaoId,
        pdiId: acao.pdiId,
        pdiVersaoId: acao.pdiVersaoId,
        titulo: acao.titulo,
        objetivo: acao.objetivo,
        resultadoEsperado: acao.resultadoEsperado,
        inicioPlanejado: acao.inicioPlanejado,
        fimPlanejado: acao.fimPlanejado,
        ordem: acao.ordem,
        statusExecucao: acao.statusExecucao,
    };
}

function erroAcao(error: unknown, operacao: 'criacao' | 'edicao' | 'remocao' = 'criacao'): ApiError {
    if (!(error instanceof ApiError)) return new ApiError('Não foi possível concluir a solicitação. Tente novamente.');
    if (error.status === 400) return new ApiError('Confira os campos e as datas planejadas da ação.', 400);
    if (error.status === 403) return new ApiError('Esta solicitação não foi autorizada. Atualize os dados e confira seu acesso.', 403);
    if (error.status === 404) return new ApiError('PDI ou ações não encontrados ou indisponíveis para este acesso.', 404);
    if (error.status === 409) {
        return new ApiError(operacao === 'remocao'
            ? 'A ação não pode ser removida neste momento ou houve um conflito. Atualize o PDI antes de tentar novamente.'
            : operacao === 'edicao'
            ? 'A ação não pode ser editada neste momento ou houve um conflito. Feche o formulário e atualize a lista antes de tentar novamente.'
            : 'O PDI não permite incluir ações neste momento ou houve um conflito. Recarregue o PDI antes de criar uma nova ação.', 409);
    }
    return error;
}

function validarContexto(pdiId: number, pdiVersaoId: number): void {
    if (!inteiroPositivo(pdiId) || !inteiroPositivo(pdiVersaoId)) {
        throw new ApiError('PDI não encontrado ou indisponível para este acesso.', 404);
    }
}

export async function listarAcoesPdi(
    pdiId: number,
    pdiVersaoId: number,
    signal?: AbortSignal,
): Promise<AcaoPdiResponse[]> {
    validarContexto(pdiId, pdiVersaoId);
    try {
        const response = await requisitarApiComSessao(`/api/pdis/${pdiId}/versoes/${pdiVersaoId}/acoes`, { signal });
        const payload = response.dados;
        if (response.status !== 200 || !Array.isArray(payload) || !payload.every(acaoValida)
            || !payload.every((acao) => acao.pdiId === pdiId && acao.pdiVersaoId === pdiVersaoId)
            || new Set(payload.map((acao) => acao.id)).size !== payload.length
            || new Set(payload.map((acao) => acao.acaoVersaoId)).size !== payload.length) {
            throw new ApiError('O servidor retornou uma listagem de ações incompatível com o PDI selecionado. Recarregue o PDI.');
        }
        // Preserve the server's ordering; never hide an action with an unexpected PDI link.
        return payload.map(copiarAcao);
    } catch (error) {
        if (signal?.aborted) throw error;
        throw erroAcao(error);
    }
}

export async function criarAcaoPdi(
    pdiId: number,
    pdiVersaoId: number,
    campos: CriarAcaoPdiRequest,
    signal?: AbortSignal,
): Promise<AcaoPdiResponse> {
    validarContexto(pdiId, pdiVersaoId);
    const corpo: CriarAcaoPdiRequest = {
        titulo: campos.titulo ?? null,
        objetivo: campos.objetivo ?? null,
        inicioPlanejado: campos.inicioPlanejado ?? null,
        fimPlanejado: campos.fimPlanejado ?? null,
        resultadoEsperado: campos.resultadoEsperado ?? null,
    };
    // A failure while obtaining a fresh token precedes the write and is not ambiguous.
    const csrf = await obterCsrf(signal);
    let response: { status: number; dados: unknown };
    try {
        response = await requisitarApiComSessao(`/api/pdis/${pdiId}/acoes?versaoId=${pdiVersaoId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', [csrf.headerName]: csrf.token },
            body: JSON.stringify(corpo),
            signal,
        });
    } catch (error) {
        if (signal?.aborted) throw error;
        if (!(error instanceof ApiError) || error.status === null
            || error.status >= 500 || (error.status >= 200 && error.status < 300)) {
            throw new GravacaoAcaoNaoConfirmadaError(error instanceof ApiError ? error.status : null);
        }
        throw erroAcao(error);
    }

    if (response.status !== 201 || !acaoValida(response.dados)
        || response.dados.pdiId !== pdiId || response.dados.pdiVersaoId !== pdiVersaoId) {
        throw new GravacaoAcaoNaoConfirmadaError(response.status);
    }
    return copiarAcao(response.dados);
}

// PUT completo: nunca omitir campos nem repetir a gravação automaticamente.
export async function atualizarAcaoPdi(
    pdiId: number,
    pdiVersaoId: number,
    acaoId: number,
    campos: AtualizarAcaoPdiRequest,
    signal?: AbortSignal,
): Promise<AcaoPdiResponse> {
    validarContexto(pdiId, pdiVersaoId);
    if (!inteiroPositivo(acaoId)) {
        throw new ApiError('Ação não encontrada ou indisponível para este acesso.', 404);
    }

    const corpo: AtualizarAcaoPdiRequest = {
        titulo: campos.titulo ?? null,
        objetivo: campos.objetivo ?? null,
        inicioPlanejado: campos.inicioPlanejado ?? null,
        fimPlanejado: campos.fimPlanejado ?? null,
        resultadoEsperado: campos.resultadoEsperado ?? null,
    };
    // Erro ao obter CSRF ocorre antes de qualquer tentativa de escrita.
    const csrf = await obterCsrf(signal);
    let response: { status: number; dados: unknown };
    try {
        response = await requisitarApiComSessao(`/api/pdis/${pdiId}/acoes/${acaoId}?versaoId=${pdiVersaoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', [csrf.headerName]: csrf.token },
            body: JSON.stringify(corpo),
            signal,
        });
    } catch (error) {
        if (signal?.aborted) throw error;
        if (!(error instanceof ApiError) || error.status === null
            || error.status >= 500 || (error.status >= 200 && error.status < 300)) {
            throw new GravacaoAcaoNaoConfirmadaError(error instanceof ApiError ? error.status : null);
        }
        throw erroAcao(error, 'edicao');
    }

    if (response.status !== 200 || !acaoValida(response.dados)
        || response.dados.id !== acaoId
        || response.dados.pdiId !== pdiId || response.dados.pdiVersaoId !== pdiVersaoId) {
        throw new GravacaoAcaoNaoConfirmadaError(response.status);
    }
    return copiarAcao(response.dados);
}

export async function removerAcaoPdi(
    pdiId: number, pdiVersaoId: number, acaoId: number, signal?: AbortSignal,
): Promise<void> {
    validarContexto(pdiId, pdiVersaoId);
    if (!inteiroPositivo(acaoId)) throw new ApiError('Ação não encontrada ou indisponível para este acesso.', 404);
    // No attempt is made if CSRF preparation fails.
    const csrf = await obterCsrf(signal);
    let response: { status: number; dados: unknown };
    try {
        response = await requisitarApiComSessao(`/api/pdis/${pdiId}/acoes/${acaoId}?versaoId=${pdiVersaoId}`, {
            method: 'DELETE', headers: { [csrf.headerName]: csrf.token }, signal,
        });
    } catch (error) {
        if (signal?.aborted) throw error;
        if (!(error instanceof ApiError) || error.status === null || error.status >= 500
            || (error.status >= 200 && error.status < 300)) {
            throw new GravacaoAcaoNaoConfirmadaError(error instanceof ApiError ? error.status : null);
        }
        throw erroAcao(error, 'remocao');
    }
    if (response.status !== 204 || response.dados !== null) {
        throw new GravacaoAcaoNaoConfirmadaError(response.status);
    }
}
