import { STATUS_APROVACAO_PDI, STATUS_EXECUCAO_PDI } from '../types/pdi';
import type {
    AtualizarPdiRascunhoRequest, CriarPdiRequest, PdiDecisaoResponse,
    PdiRascunhoResponse, PdiSubmetidoResponse, PdiVersaoResponse,
} from '../types/pdi';
import { obterCsrf } from './auth';
import { ApiError, requisitarApiComSessao } from './http';

export class GravacaoPdiNaoConfirmadaError extends ApiError {
    constructor(status: number | null = null) {
        super('Não foi possível confirmar a gravação. Confira a listagem antes de enviar novamente.', status);
        this.name = 'GravacaoPdiNaoConfirmadaError';
    }
}

type Operacao = 'rascunho' | 'submissao' | 'decisao';

function inteiroPositivo(value: unknown): value is number {
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function objeto(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function textoOpcional(value: unknown): boolean {
    return value == null || typeof value === 'string';
}

function uuid(value: unknown): boolean {
    return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function instante(value: unknown): boolean {
    return typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value));
}

function baseValida(pdi: Record<string, unknown>): boolean {
    return inteiroPositivo(pdi.id) && inteiroPositivo(pdi.versaoId)
        && (pdi.versaoVigenteId == null || inteiroPositivo(pdi.versaoVigenteId))
        && STATUS_EXECUCAO_PDI.some((status) => status === pdi.statusExecucao)
        && STATUS_APROVACAO_PDI.some((status) => status === pdi.statusAprovacao)
        && textoOpcional(pdi.titulo) && textoOpcional(pdi.objetivo)
        && textoOpcional(pdi.inicioPlanejado) && textoOpcional(pdi.fimPlanejado)
        && instante(pdi.criadoEm);
}

function rascunhoValido(value: unknown): value is PdiRascunhoResponse {
    return objeto(value) && baseValida(value) && inteiroPositivo(value.numeroVersao)
        && instante(value.versaoCriadaEm);
}

function submetidoValido(value: unknown): value is PdiSubmetidoResponse {
    return objeto(value) && baseValida(value) && inteiroPositivo(value.numero)
        && instante(value.criadaVersaoEm)
        && (value.submetidaEm === null || instante(value.submetidaEm))
        && (value.gestorNaSubmissaoId === null || uuid(value.gestorNaSubmissaoId));
}

function versaoValida(value: unknown): value is PdiVersaoResponse {
    if (!submetidoValido(value) || !objeto(value)) return false;
    return uuid(value.titularId) && (value.gestorAtualId === null || uuid(value.gestorAtualId))
        && (value.decididaEm === null || instante(value.decididaEm))
        && (value.decididoPorId === null || uuid(value.decididoPorId))
        && (value.justificativaDecisao === null || typeof value.justificativaDecisao === 'string');
}

function copiarRascunho(pdi: PdiRascunhoResponse): PdiRascunhoResponse {
    return {
        id: pdi.id, versaoId: pdi.versaoId, numeroVersao: pdi.numeroVersao,
        versaoVigenteId: pdi.versaoVigenteId ?? null,
        statusExecucao: pdi.statusExecucao, statusAprovacao: pdi.statusAprovacao,
        titulo: pdi.titulo ?? null, objetivo: pdi.objetivo ?? null,
        inicioPlanejado: pdi.inicioPlanejado ?? null, fimPlanejado: pdi.fimPlanejado ?? null,
        criadoEm: pdi.criadoEm, versaoCriadaEm: pdi.versaoCriadaEm,
    };
}

function copiarSubmetido(pdi: PdiSubmetidoResponse): PdiSubmetidoResponse {
    return {
        id: pdi.id, versaoId: pdi.versaoId, numero: pdi.numero,
        versaoVigenteId: pdi.versaoVigenteId ?? null,
        statusExecucao: pdi.statusExecucao, statusAprovacao: pdi.statusAprovacao,
        titulo: pdi.titulo ?? null, objetivo: pdi.objetivo ?? null,
        inicioPlanejado: pdi.inicioPlanejado ?? null, fimPlanejado: pdi.fimPlanejado ?? null,
        criadoEm: pdi.criadoEm, criadaVersaoEm: pdi.criadaVersaoEm,
        submetidaEm: pdi.submetidaEm, gestorNaSubmissaoId: pdi.gestorNaSubmissaoId,
    };
}

function copiarVersao(pdi: PdiVersaoResponse): PdiVersaoResponse {
    return {
        ...copiarSubmetido(pdi), titularId: pdi.titularId, gestorAtualId: pdi.gestorAtualId,
        decididaEm: pdi.decididaEm, decididoPorId: pdi.decididoPorId,
        justificativaDecisao: pdi.justificativaDecisao,
    };
}

function erroPdi(error: unknown, operacao: Operacao = 'rascunho'): ApiError {
    if (!(error instanceof ApiError)) return new ApiError('Não foi possível concluir a solicitação. Tente novamente.');
    if (error.status === 400) return new ApiError(operacao === 'decisao'
        ? 'Confira a decisão e preencha a justificativa ao rejeitar.'
        : 'Confira os campos, as datas e a versão do PDI.', 400);
    if (error.status === 403) return new ApiError('Esta solicitação não foi autorizada. Atualize os dados e confira seu acesso.', 403);
    if (error.status === 404) return new ApiError('PDI ou versão não encontrado ou indisponível para este acesso.', 404);
    if (error.status === 409) return new ApiError(operacao === 'submissao'
        ? 'Não foi possível submeter esta versão. Atualize o PDI e confira suas ações e o gestor responsável.'
        : operacao === 'decisao'
            ? 'Esta versão não está mais disponível para a decisão. Atualize as pendências.'
            : 'O rascunho não pode ser editado neste momento ou houve um conflito. Recarregue os dados antes de tentar novamente.', 409);
    return error;
}

function validarId(id: number): void {
    if (!inteiroPositivo(id)) {
        throw new ApiError('PDI ou versão não encontrado ou indisponível para este acesso.', 404);
    }
}

function validarContexto(id: number, versaoId: number): void {
    if (!inteiroPositivo(id) || !inteiroPositivo(versaoId)) {
        throw new ApiError('PDI ou versão não encontrado ou indisponível para este acesso.', 404);
    }
}

function versoesUnicas(values: { versaoId: number }[]): boolean {
    return new Set(values.map((item) => item.versaoId)).size === values.length;
}

// This guard describes the owner draft DTO only; the server revalidates ownership/history.
export function podeEditarRascunho(pdi: PdiRascunhoResponse): boolean {
    return inteiroPositivo(pdi.versaoId) && inteiroPositivo(pdi.numeroVersao)
        && pdi.statusAprovacao === 'RASCUNHO' && pdi.statusExecucao === 'NAO_INICIADO'
        && pdi.versaoVigenteId == null;
}

export async function listarRascunhos(signal?: AbortSignal): Promise<PdiRascunhoResponse[]> {
    const response = await requisitarApiComSessao('/api/pdis', { signal });
    const payload = response.dados;
    if (response.status !== 200 || !Array.isArray(payload) || !payload.every(rascunhoValido)
        || !versoesUnicas(payload) || new Set(payload.map((pdi) => pdi.id)).size !== payload.length) {
        throw new ApiError('O back-end retornou uma listagem de rascunhos em formato inesperado.');
    }
    return payload.map(copiarRascunho);
}

export async function buscarRascunho(id: number, signal?: AbortSignal): Promise<PdiRascunhoResponse> {
    validarId(id);
    try {
        const response = await requisitarApiComSessao(`/api/pdis/${id}`, { signal });
        if (response.status !== 200 || !rascunhoValido(response.dados) || response.dados.id !== id) {
            throw new ApiError('O servidor retornou um rascunho em formato inesperado.');
        }
        return copiarRascunho(response.dados);
    } catch (error) {
        if (signal?.aborted) throw error;
        throw erroPdi(error);
    }
}

// Fetch a fresh token before each write. Failure here precedes the write and is not ambiguous.
async function escrever(
    path: `/api/${string}`, method: 'POST' | 'PUT', body: object | undefined,
    operacao: Operacao, signal?: AbortSignal,
): Promise<{ status: number; dados: unknown }> {
    const csrf = await obterCsrf(signal);
    try {
        return await requisitarApiComSessao(path, {
            method,
            headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), [csrf.headerName]: csrf.token },
            body: body === undefined ? undefined : JSON.stringify(body), signal,
        });
    } catch (error) {
        if (signal?.aborted) throw error;
        if (!(error instanceof ApiError) || error.status === null || error.status >= 500
            || (error.status >= 200 && error.status < 300)) {
            throw new GravacaoPdiNaoConfirmadaError(error instanceof ApiError ? error.status : null);
        }
        throw erroPdi(error, operacao);
    }
}

function camposRascunho(campos: CriarPdiRequest): CriarPdiRequest {
    return {
        titulo: campos.titulo ?? null, objetivo: campos.objetivo ?? null,
        inicioPlanejado: campos.inicioPlanejado ?? null, fimPlanejado: campos.fimPlanejado ?? null,
    };
}

export async function criarRascunho(campos: CriarPdiRequest, signal?: AbortSignal): Promise<PdiRascunhoResponse> {
    const response = await escrever('/api/pdis', 'POST', camposRascunho(campos), 'rascunho', signal);
    if (response.status !== 201 || !rascunhoValido(response.dados) || !podeEditarRascunho(response.dados)
        || response.dados.numeroVersao !== 1) throw new GravacaoPdiNaoConfirmadaError(response.status);
    return copiarRascunho(response.dados);
}

export async function atualizarRascunho(
    id: number, versaoId: number, campos: AtualizarPdiRascunhoRequest, signal?: AbortSignal,
): Promise<PdiRascunhoResponse> {
    validarContexto(id, versaoId);
    const response = await escrever(`/api/pdis/${id}?versaoId=${versaoId}`, 'PUT', camposRascunho(campos), 'rascunho', signal);
    if (response.status !== 200 || !rascunhoValido(response.dados) || response.dados.id !== id
        || response.dados.versaoId !== versaoId || !podeEditarRascunho(response.dados)) {
        throw new GravacaoPdiNaoConfirmadaError(response.status);
    }
    return copiarRascunho(response.dados);
}

export async function listarSubmetidos(signal?: AbortSignal): Promise<PdiSubmetidoResponse[]> {
    const response = await requisitarApiComSessao('/api/pdis/submetidos', { signal });
    const payload = response.dados;
    if (response.status !== 200 || !Array.isArray(payload) || !payload.every(submetidoValido)
        || !versoesUnicas(payload) || payload.some((pdi) => pdi.submetidaEm === null || pdi.statusAprovacao === 'RASCUNHO')) {
        throw new ApiError('O servidor retornou versões submetidas em formato inesperado.');
    }
    return payload.map(copiarSubmetido);
}

export async function listarPendentes(signal?: AbortSignal): Promise<PdiVersaoResponse[]> {
    try {
        const response = await requisitarApiComSessao('/api/pdis/pendentes', { signal });
        const payload = response.dados;
        if (response.status !== 200 || !Array.isArray(payload) || !payload.every(versaoValida)
            || !versoesUnicas(payload) || payload.some((pdi) => pdi.statusAprovacao !== 'AGUARDANDO_APROVACAO' || pdi.submetidaEm === null)) {
            throw new ApiError('O servidor retornou pendências em formato inesperado.');
        }
        return payload.map(copiarVersao);
    } catch (error) {
        if (signal?.aborted) throw error;
        throw erroPdi(error, 'decisao');
    }
}

export async function listarVersoes(id: number, signal?: AbortSignal): Promise<PdiVersaoResponse[]> {
    validarId(id);
    try {
        const response = await requisitarApiComSessao(`/api/pdis/${id}/versoes`, { signal });
        const payload = response.dados;
        if (response.status !== 200 || !Array.isArray(payload) || !payload.every(versaoValida)
            || !versoesUnicas(payload) || payload.some((pdi) => pdi.id !== id)) {
            throw new ApiError('O servidor retornou versões incompatíveis com o PDI selecionado.');
        }
        return payload.map(copiarVersao);
    } catch (error) {
        if (signal?.aborted) throw error;
        throw erroPdi(error);
    }
}

export async function buscarVersao(id: number, versaoId: number, signal?: AbortSignal): Promise<PdiVersaoResponse> {
    validarContexto(id, versaoId);
    try {
        const response = await requisitarApiComSessao(`/api/pdis/${id}/versoes/${versaoId}`, { signal });
        if (response.status !== 200 || !versaoValida(response.dados)
            || response.dados.id !== id || response.dados.versaoId !== versaoId) {
            throw new ApiError('O servidor retornou uma versão incompatível com o PDI selecionado.');
        }
        return copiarVersao(response.dados);
    } catch (error) {
        if (signal?.aborted) throw error;
        throw erroPdi(error);
    }
}

export async function submeterPdi(id: number, versaoId: number, signal?: AbortSignal): Promise<PdiSubmetidoResponse> {
    validarContexto(id, versaoId);
    const response = await escrever(`/api/pdis/${id}/submeter?versaoId=${versaoId}`, 'POST', undefined, 'submissao', signal);
    if (response.status !== 200 || !submetidoValido(response.dados) || response.dados.id !== id
        || response.dados.versaoId !== versaoId || response.dados.statusAprovacao !== 'AGUARDANDO_APROVACAO'
        || response.dados.submetidaEm === null || response.dados.versaoVigenteId !== null
        || response.dados.statusExecucao !== 'NAO_INICIADO') throw new GravacaoPdiNaoConfirmadaError(response.status);
    return copiarSubmetido(response.dados);
}

export async function decidirPdi(
    id: number, versaoId: number, decisao: 'aprovar' | 'reprovar', justificativa: string | null,
    signal?: AbortSignal,
): Promise<PdiDecisaoResponse> {
    validarContexto(id, versaoId);
    if (decisao !== 'aprovar' && decisao !== 'reprovar') throw new ApiError('Decisão inválida.', 400);
    const motivo = justificativa?.trim() || null;
    if (decisao === 'reprovar' && motivo === null) throw new ApiError('Informe uma justificativa para rejeitar o PDI.', 400);
    const response = await escrever(`/api/pdis/${id}/versoes/${versaoId}/${decisao}`, 'POST', { justificativa: motivo }, 'decisao', signal);
    const payload = response.dados;
    if (response.status !== 200 || !objeto(payload) || !versaoValida(payload.versaoDecidida)) {
        throw new GravacaoPdiNaoConfirmadaError(response.status);
    }
    const versao = payload.versaoDecidida;
    const aprovada = decisao === 'aprovar';
    if (versao.id !== id || versao.versaoId !== versaoId || versao.statusExecucao !== 'NAO_INICIADO'
        || versao.statusAprovacao !== (aprovada ? 'APROVADO' : 'REPROVADO')
        || versao.decididaEm === null || versao.decididoPorId === null || versao.submetidaEm === null
        || (aprovada ? versao.versaoVigenteId !== versaoId || payload.novaVersaoId !== null || payload.novoNumero !== null
            : versao.versaoVigenteId !== null || !inteiroPositivo(payload.novaVersaoId)
                || payload.novaVersaoId === versaoId || payload.novoNumero !== versao.numero + 1
                || !versao.justificativaDecisao?.trim())) {
        throw new GravacaoPdiNaoConfirmadaError(response.status);
    }
    return {
        versaoDecidida: copiarVersao(versao),
        novaVersaoId: aprovada ? null : payload.novaVersaoId as number,
        novoNumero: aprovada ? null : payload.novoNumero as number,
    };
}
