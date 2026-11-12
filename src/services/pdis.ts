import { STATUS_APROVACAO_PDI, STATUS_EXECUCAO_PDI } from '../types/pdi';
import type { AtualizarPdiRascunhoRequest, CriarPdiRequest, PdiRascunhoResponse } from '../types/pdi';
import { obterCsrf } from './auth';
import { ApiError, requisitarApiComSessao } from './http';

export class GravacaoPdiNaoConfirmadaError extends ApiError {
    constructor(status: number | null = null) {
        super('Não foi possível confirmar a gravação. Confira a listagem antes de enviar novamente.', status);
        this.name = 'GravacaoPdiNaoConfirmadaError';
    }
}

function inteiroPositivo(value: unknown): value is number {
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function textoOpcional(value: unknown): boolean {
    return value == null || typeof value === 'string';
}

function rascunhoValido(value: unknown): value is PdiRascunhoResponse {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
    const pdi = value as Record<string, unknown>;
    return (
        inteiroPositivo(pdi.id) &&
        inteiroPositivo(pdi.versaoId) &&
        inteiroPositivo(pdi.numeroVersao) &&
        (pdi.versaoVigenteId == null || inteiroPositivo(pdi.versaoVigenteId)) &&
        STATUS_EXECUCAO_PDI.some((status) => status === pdi.statusExecucao) &&
        STATUS_APROVACAO_PDI.some((status) => status === pdi.statusAprovacao) &&
        textoOpcional(pdi.titulo) &&
        textoOpcional(pdi.objetivo) &&
        textoOpcional(pdi.inicioPlanejado) &&
        textoOpcional(pdi.fimPlanejado) &&
        typeof pdi.criadoEm === 'string' &&
        typeof pdi.versaoCriadaEm === 'string'
    );
}

function copiarRascunho(pdi: PdiRascunhoResponse): PdiRascunhoResponse {
    return {
        id: pdi.id,
        versaoId: pdi.versaoId,
        numeroVersao: pdi.numeroVersao,
        versaoVigenteId: pdi.versaoVigenteId ?? null,
        statusExecucao: pdi.statusExecucao,
        statusAprovacao: pdi.statusAprovacao,
        titulo: pdi.titulo ?? null,
        objetivo: pdi.objetivo ?? null,
        inicioPlanejado: pdi.inicioPlanejado ?? null,
        fimPlanejado: pdi.fimPlanejado ?? null,
        criadoEm: pdi.criadoEm,
        versaoCriadaEm: pdi.versaoCriadaEm,
    };
}

function erroRascunho(error: unknown): ApiError {
    if (!(error instanceof ApiError)) return new ApiError('Não foi possível concluir a solicitação. Tente novamente.');
    if (error.status === 400) return new ApiError('Confira os campos e as datas planejadas do rascunho.', 400);
    if (error.status === 404) return new ApiError('Rascunho não encontrado ou indisponível para este acesso.', 404);
    if (error.status === 409) {
        return new ApiError('O rascunho não pode ser editado neste momento ou houve um conflito. Recarregue os dados antes de tentar novamente.', 409);
    }
    return error;
}

// These are only the conditions visible in the DTO. The server still checks ownership and submission history.
export function podeEditarRascunho(pdi: PdiRascunhoResponse): boolean {
    return pdi.numeroVersao === 1
        && pdi.statusAprovacao === 'RASCUNHO'
        && pdi.statusExecucao === 'NAO_INICIADO'
        && pdi.versaoVigenteId == null;
}

export async function listarRascunhos(signal?: AbortSignal): Promise<PdiRascunhoResponse[]> {
    const response = await requisitarApiComSessao('/api/pdis', { signal });
    const payload = response.dados;
    if (response.status !== 200 || !Array.isArray(payload) || !payload.every(rascunhoValido)) {
        throw new ApiError('O back-end retornou uma listagem de rascunhos em formato inesperado.');
    }
    return payload.map(copiarRascunho);
}

export async function buscarRascunho(id: number, signal?: AbortSignal): Promise<PdiRascunhoResponse> {
    if (!inteiroPositivo(id)) throw new ApiError('Rascunho não encontrado ou indisponível para este acesso.', 404);
    try {
        const response = await requisitarApiComSessao(`/api/pdis/${id}`, { signal });
        if (response.status !== 200 || !rascunhoValido(response.dados) || response.dados.id !== id) {
            throw new ApiError('O servidor retornou um rascunho em formato inesperado.');
        }
        return copiarRascunho(response.dados);
    } catch (error) {
        if (signal?.aborted) throw error;
        throw erroRascunho(error);
    }
}

async function gravarRascunho(
    method: 'POST' | 'PUT',
    campos: CriarPdiRequest,
    id?: number,
    signal?: AbortSignal,
): Promise<PdiRascunhoResponse> {
    // Fetch the current token for this write; never store it or retry a write automatically.
    const csrf = await obterCsrf(signal);
    const corpo: CriarPdiRequest = {
        titulo: campos.titulo ?? null,
        objetivo: campos.objetivo ?? null,
        inicioPlanejado: campos.inicioPlanejado ?? null,
        fimPlanejado: campos.fimPlanejado ?? null,
    };
    let response: { status: number; dados: unknown };
    try {
        response = await requisitarApiComSessao(id === undefined ? '/api/pdis' : `/api/pdis/${id}`, {
            method,
            headers: { 'Content-Type': 'application/json', [csrf.headerName]: csrf.token },
            body: JSON.stringify(corpo),
            signal,
        });
    } catch (error) {
        if (signal?.aborted) throw error;
        if (!(error instanceof ApiError) || error.status === null
            || error.status >= 500 || (error.status >= 200 && error.status < 300)) {
            throw new GravacaoPdiNaoConfirmadaError(error instanceof ApiError ? error.status : null);
        }
        throw erroRascunho(error);
    }

    const esperado = method === 'POST' ? 201 : 200;
    if (response.status !== esperado || !rascunhoValido(response.dados)
        || (id !== undefined && response.dados.id !== id)) {
        throw new GravacaoPdiNaoConfirmadaError(response.status);
    }
    return copiarRascunho(response.dados);
}

export function criarRascunho(
    campos: CriarPdiRequest, signal?: AbortSignal,
): Promise<PdiRascunhoResponse> {
    return gravarRascunho('POST', campos, undefined, signal);
}

export function atualizarRascunho(
    id: number, campos: AtualizarPdiRascunhoRequest, signal?: AbortSignal,
): Promise<PdiRascunhoResponse> {
    if (!inteiroPositivo(id)) return Promise.reject(new ApiError('Rascunho não encontrado ou indisponível para este acesso.', 404));
    return gravarRascunho('PUT', campos, id, signal);
}
