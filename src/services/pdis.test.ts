import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PdiRascunhoResponse, PdiSubmetidoResponse, PdiVersaoResponse } from '../types/pdi';
import { obterCsrf } from './auth';
import { ApiError, requisitarApiComSessao } from './http';
import {
    atualizarRascunho, buscarRascunho, buscarVersao, criarRascunho, decidirPdi,
    GravacaoPdiNaoConfirmadaError, listarPendentes, listarRascunhos, listarSubmetidos,
    listarVersoes, podeEditarRascunho, submeterPdi,
} from './pdis';

vi.mock('./auth', () => ({ obterCsrf: vi.fn() }));
vi.mock('./http', async (importOriginal) => ({
    ...await importOriginal<typeof import('./http')>(), requisitarApiComSessao: vi.fn(),
}));

const csrf = { headerName: 'X-CSRF-TOKEN', parameterName: '_csrf', token: 'test-only-token' };
const titular = '11111111-1111-4111-8111-111111111111';
const gestor = '22222222-2222-4222-8222-222222222222';
const campos = { titulo: 'Plano de teste', objetivo: 'Objetivo', inicioPlanejado: '2026-01-01', fimPlanejado: '2026-12-31' };
const rascunho: PdiRascunhoResponse = {
    id: 10, versaoId: 102, numeroVersao: 2, versaoVigenteId: null,
    statusAprovacao: 'RASCUNHO', statusExecucao: 'NAO_INICIADO', ...campos,
    criadoEm: '2026-01-01T10:00:00Z', versaoCriadaEm: '2026-01-02T10:00:00Z',
};
const submetido: PdiSubmetidoResponse = {
    id: 10, versaoId: 102, numero: 2, versaoVigenteId: null,
    statusAprovacao: 'AGUARDANDO_APROVACAO', statusExecucao: 'NAO_INICIADO', ...campos,
    criadoEm: rascunho.criadoEm, criadaVersaoEm: rascunho.versaoCriadaEm,
    submetidaEm: '2026-01-03T10:00:00Z', gestorNaSubmissaoId: gestor,
};
const versao: PdiVersaoResponse = {
    ...submetido, titularId: titular, gestorAtualId: gestor,
    decididaEm: null, decididoPorId: null, justificativaDecisao: null,
};
const transporte = vi.mocked(requisitarApiComSessao);

beforeEach(() => {
    vi.clearAllMocks();
    transporte.mockReset();
    vi.mocked(obterCsrf).mockReset().mockResolvedValue(csrf);
});

describe('rascunhos e versão esperada', () => {
    it('permite revisão posterior à primeira, sem liberar estados históricos', () => {
        expect(podeEditarRascunho(rascunho)).toBe(true);
        for (const statusAprovacao of ['AGUARDANDO_APROVACAO', 'APROVADO', 'REPROVADO', 'RETIRADA'] as const) {
            expect(podeEditarRascunho({ ...rascunho, statusAprovacao })).toBe(false);
        }
        expect(podeEditarRascunho({ ...rascunho, versaoVigenteId: 101 })).toBe(false);
        expect(podeEditarRascunho({ ...rascunho, statusExecucao: 'EM_EXECUCAO' })).toBe(false);
    });

    it('lista e consulta rascunhos reais, preservando o contrato próprio', async () => {
        transporte.mockResolvedValueOnce({ status: 200, dados: [rascunho] })
            .mockResolvedValueOnce({ status: 200, dados: rascunho });
        expect(await listarRascunhos()).toEqual([rascunho]);
        expect(await buscarRascunho(10)).toEqual(rascunho);
        expect(transporte).toHaveBeenNthCalledWith(1, '/api/pdis', { signal: undefined });
        expect(transporte).toHaveBeenNthCalledWith(2, '/api/pdis/10', { signal: undefined });
        expect(obterCsrf).not.toHaveBeenCalled();
    });

    it('cria somente com os quatro campos planejados e confirma 201', async () => {
        const inicial = { ...rascunho, numeroVersao: 1, versaoId: 101 };
        transporte.mockResolvedValue({ status: 201, dados: inicial });
        expect(await criarRascunho(campos)).toEqual(inicial);
        expect(transporte).toHaveBeenCalledWith('/api/pdis', expect.objectContaining({
            method: 'POST', body: JSON.stringify(campos), headers: expect.objectContaining({ 'X-CSRF-TOKEN': csrf.token }),
        }));
    });

    it('atualiza a revisão 2 com o ID de versão, não com o número', async () => {
        transporte.mockResolvedValue({ status: 200, dados: rascunho });
        expect(await atualizarRascunho(10, 102, campos)).toEqual(rascunho);
        expect(transporte).toHaveBeenCalledWith('/api/pdis/10?versaoId=102', expect.objectContaining({ method: 'PUT' }));
    });

    it('rejeita retorno de outra versão após a escrita como resultado incerto', async () => {
        transporte.mockResolvedValue({ status: 200, dados: { ...rascunho, versaoId: 999 } });
        await expect(atualizarRascunho(10, 102, campos)).rejects.toBeInstanceOf(GravacaoPdiNaoConfirmadaError);
        expect(transporte).toHaveBeenCalledTimes(1);
    });

    it('não esconde inconsistências de IDs nas leituras', async () => {
        transporte.mockResolvedValue({ status: 200, dados: { ...rascunho, id: 99 } });
        await expect(buscarRascunho(10)).rejects.toBeInstanceOf(ApiError);
    });
});

describe('submissão e consulta de versões', () => {
    it('submete e ressubmete a versão exata com token novo em cada escrita', async () => {
        transporte.mockResolvedValue({ status: 200, dados: submetido });
        vi.mocked(obterCsrf).mockResolvedValueOnce(csrf).mockResolvedValueOnce({ ...csrf, token: 'next-test-token' });
        await submeterPdi(10, 102);
        await submeterPdi(10, 102);
        expect(transporte).toHaveBeenNthCalledWith(1, '/api/pdis/10/submeter?versaoId=102', expect.objectContaining({
            method: 'POST', body: undefined, headers: { 'X-CSRF-TOKEN': csrf.token },
        }));
        expect(transporte).toHaveBeenNthCalledWith(2, '/api/pdis/10/submeter?versaoId=102', expect.objectContaining({
            headers: { 'X-CSRF-TOKEN': 'next-test-token' },
        }));
        expect(obterCsrf).toHaveBeenCalledTimes(2);
    });

    it('carrega submetidos, pendências e detalhe com os DTOs G8', async () => {
        transporte.mockResolvedValueOnce({ status: 200, dados: [submetido] })
            .mockResolvedValueOnce({ status: 200, dados: [versao] })
            .mockResolvedValueOnce({ status: 200, dados: [versao] })
            .mockResolvedValueOnce({ status: 200, dados: versao });
        expect(await listarSubmetidos()).toEqual([submetido]);
        expect(await listarPendentes()).toEqual([versao]);
        expect(await listarVersoes(10)).toEqual([versao]);
        expect(await buscarVersao(10, 102)).toEqual(versao);
        expect(transporte.mock.calls.map(([url]) => url)).toEqual([
            '/api/pdis/submetidos', '/api/pdis/pendentes', '/api/pdis/10/versoes', '/api/pdis/10/versoes/102',
        ]);
    });

    it('não mistura campos de rascunho com campos de versão submetida', async () => {
        transporte.mockResolvedValue({ status: 200, dados: [rascunho] });
        await expect(listarSubmetidos()).rejects.toBeInstanceOf(ApiError);
    });

    it('não aceita pendência já decidida ou versão pertencente a outro PDI', async () => {
        transporte.mockResolvedValueOnce({ status: 200, dados: [{ ...versao, statusAprovacao: 'APROVADO' }] })
            .mockResolvedValueOnce({ status: 200, dados: [{ ...versao, id: 20 }] });
        await expect(listarPendentes()).rejects.toBeInstanceOf(ApiError);
        await expect(listarVersoes(10)).rejects.toBeInstanceOf(ApiError);
    });

    it('consulta a vigente pelo ID explícito e mantém as decisões históricas', async () => {
        const aprovada: PdiVersaoResponse = {
            ...versao, statusAprovacao: 'APROVADO', versaoVigenteId: 102,
            decididaEm: '2026-01-04T10:00:00Z', decididoPorId: gestor,
        };
        transporte.mockResolvedValue({ status: 200, dados: aprovada });
        expect(await buscarVersao(10, 102)).toEqual(aprovada);
        expect(aprovada.statusExecucao).toBe('NAO_INICIADO');
    });
});

describe('aprovação e rejeição', () => {
    it('aprova com justificativa opcional e confirma a vigente sem iniciar execução', async () => {
        const decidida = { ...versao, statusAprovacao: 'APROVADO', versaoVigenteId: 102,
            decididaEm: '2026-01-04T10:00:00Z', decididoPorId: gestor };
        transporte.mockResolvedValue({ status: 200, dados: { versaoDecidida: decidida, novaVersaoId: null, novoNumero: null } });
        const resultado = await decidirPdi(10, 102, 'aprovar', null);
        expect(resultado.versaoDecidida.statusAprovacao).toBe('APROVADO');
        expect(resultado.versaoDecidida.statusExecucao).toBe('NAO_INICIADO');
        expect(transporte).toHaveBeenCalledWith('/api/pdis/10/versoes/102/aprovar', expect.objectContaining({
            method: 'POST', body: JSON.stringify({ justificativa: null }),
        }));
    });

    it.each([null, '', '   ', '\n\t'])('rejeição sem justificativa não inicia escrita (%j)', async (motivo) => {
        await expect(decidirPdi(10, 102, 'reprovar', motivo)).rejects.toMatchObject({ status: 400 });
        expect(obterCsrf).not.toHaveBeenCalled();
        expect(transporte).not.toHaveBeenCalled();
    });

    it('rejeita com justificativa e recebe só a identidade da revisão criada no servidor', async () => {
        const decidida = { ...versao, statusAprovacao: 'REPROVADO', justificativaDecisao: 'Corrigir prazo',
            decididaEm: '2026-01-04T10:00:00Z', decididoPorId: gestor };
        transporte.mockResolvedValue({ status: 200, dados: { versaoDecidida: decidida, novaVersaoId: 103, novoNumero: 3 } });
        const resultado = await decidirPdi(10, 102, 'reprovar', ' Corrigir prazo ');
        expect(resultado.novaVersaoId).toBe(103);
        expect(resultado.novoNumero).toBe(3);
        expect(transporte.mock.calls[0][1]?.body).toBe(JSON.stringify({ justificativa: 'Corrigir prazo' }));
        expect(transporte).toHaveBeenCalledTimes(1);
    });

    it('não anuncia aprovação se o servidor devolver decisão ou versão divergente', async () => {
        transporte.mockResolvedValue({ status: 200, dados: { versaoDecidida: versao, novaVersaoId: null, novoNumero: null } });
        await expect(decidirPdi(10, 102, 'aprovar', null)).rejects.toBeInstanceOf(GravacaoPdiNaoConfirmadaError);
    });
});

describe('segurança e falhas sem repetição automática', () => {
    it.each([400, 401, 403, 404, 409])('preserva o código HTTP %i sem repetir submissão', async (status) => {
        transporte.mockRejectedValue(new ApiError('Mensagem não exibida diretamente', status));
        await expect(submeterPdi(10, 102)).rejects.toMatchObject({ status });
        expect(transporte).toHaveBeenCalledTimes(1);
    });

    it('RH sem autorização recebe erro, em vez de lista vazia fictícia', async () => {
        transporte.mockRejectedValue(new ApiError('Negado', 403));
        await expect(listarPendentes()).rejects.toMatchObject({ status: 403 });
    });

    it.each([null, 500, 503, 200])('resultado de escrita incerto (%j) não é repetido', async (status) => {
        transporte.mockRejectedValue(new ApiError('Falha', status));
        await expect(submeterPdi(10, 102)).rejects.toBeInstanceOf(GravacaoPdiNaoConfirmadaError);
        expect(transporte).toHaveBeenCalledTimes(1);
    });

    it('falha ao preparar CSRF não é classificada como escrita incerta', async () => {
        const falha = new ApiError('CSRF indisponível', 403);
        vi.mocked(obterCsrf).mockRejectedValue(falha);
        await expect(submeterPdi(10, 102)).rejects.toBe(falha);
        expect(transporte).not.toHaveBeenCalled();
    });

    it.each([0, -1, NaN, 1.5])('versão inválida (%j) não realiza chamadas', async (versaoId) => {
        await expect(submeterPdi(10, versaoId)).rejects.toMatchObject({ status: 404 });
        expect(obterCsrf).not.toHaveBeenCalled();
        expect(transporte).not.toHaveBeenCalled();
    });

    it('encaminha cancelamento e preserva o erro de abort sem retry', async () => {
        const controller = new AbortController();
        const cancelamento = new DOMException('Requisição cancelada.', 'AbortError');
        transporte.mockImplementation(async () => { controller.abort(); throw cancelamento; });
        await expect(submeterPdi(10, 102, controller.signal)).rejects.toBe(cancelamento);
        expect(transporte).toHaveBeenCalledTimes(1);
        expect(transporte.mock.calls[0][1]?.signal).toBe(controller.signal);
    });
});
