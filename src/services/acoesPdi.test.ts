import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AcaoPdiResponse } from '../types/acaoPdi';
import { obterCsrf } from './auth';
import { ApiError, requisitarApiComSessao } from './http';
import { atualizarAcaoPdi, criarAcaoPdi, GravacaoAcaoNaoConfirmadaError, listarAcoesPdi, removerAcaoPdi } from './acoesPdi';

vi.mock('./auth', () => ({ obterCsrf: vi.fn() }));
vi.mock('./http', async (importOriginal) => ({
    ...await importOriginal<typeof import('./http')>(), requisitarApiComSessao: vi.fn(),
}));

const csrf = { headerName: 'X-CSRF-TOKEN', parameterName: '_csrf', token: 'test-only-token' };
const campos = { titulo: 'Ação de teste', objetivo: 'Objetivo', resultadoEsperado: 'Resultado', inicioPlanejado: null, fimPlanejado: null };
const acao: AcaoPdiResponse = { id: 20, acaoVersaoId: 201, pdiId: 10, pdiVersaoId: 102, ordem: 1, statusExecucao: 'NAO_INICIADA', ...campos };
const transporte = vi.mocked(requisitarApiComSessao);

beforeEach(() => {
    vi.clearAllMocks();
    transporte.mockReset();
    vi.mocked(obterCsrf).mockReset().mockResolvedValue(csrf);
});

describe('ações da versão selecionada', () => {
    it('consulta a rota de versão para rascunhos, histórico e vigente', async () => {
        transporte.mockResolvedValue({ status: 200, dados: [acao] });
        expect(await listarAcoesPdi(10, 102)).toEqual([acao]);
        expect(transporte).toHaveBeenCalledWith('/api/pdis/10/versoes/102/acoes', { signal: undefined });
        expect(obterCsrf).not.toHaveBeenCalled();
    });

    it('preserva a ordem e rejeita vínculos inconsistentes, sem esconder registros', async () => {
        transporte.mockResolvedValue({ status: 200, dados: [{ ...acao, pdiVersaoId: 101 }] });
        await expect(listarAcoesPdi(10, 102)).rejects.toBeInstanceOf(ApiError);
    });

    it('rejeita ações duplicadas na resposta', async () => {
        transporte.mockResolvedValue({ status: 200, dados: [acao, acao] });
        await expect(listarAcoesPdi(10, 102)).rejects.toBeInstanceOf(ApiError);
    });

    it('cria na revisão usando versaoId e confirma o vínculo retornado', async () => {
        transporte.mockResolvedValue({ status: 201, dados: acao });
        expect(await criarAcaoPdi(10, 102, campos)).toEqual(acao);
        expect(transporte).toHaveBeenCalledWith('/api/pdis/10/acoes?versaoId=102', expect.objectContaining({
            method: 'POST', headers: expect.objectContaining({ 'X-CSRF-TOKEN': csrf.token }),
        }));
        expect(JSON.parse(String(transporte.mock.calls[0][1]?.body))).toEqual(campos);
    });

    it('edita por ID da ação e envia o ID da versão, não acaoVersaoId', async () => {
        transporte.mockResolvedValue({ status: 200, dados: acao });
        expect(await atualizarAcaoPdi(10, 102, 20, campos)).toEqual(acao);
        expect(transporte).toHaveBeenCalledWith('/api/pdis/10/acoes/20?versaoId=102', expect.objectContaining({ method: 'PUT' }));
    });

    it('remove logicamente com DELETE, CSRF atual e confirmação 204', async () => {
        transporte.mockResolvedValue({ status: 204, dados: null });
        await expect(removerAcaoPdi(10, 102, 20)).resolves.toBeUndefined();
        expect(transporte).toHaveBeenCalledWith('/api/pdis/10/acoes/20?versaoId=102', {
            method: 'DELETE', headers: { 'X-CSRF-TOKEN': csrf.token }, signal: undefined,
        });
        expect(obterCsrf).toHaveBeenCalledTimes(1);
    });

    it('trata remoção com resposta inesperada como incerta', async () => {
        transporte.mockResolvedValue({ status: 200, dados: acao });
        await expect(removerAcaoPdi(10, 102, 20)).rejects.toBeInstanceOf(GravacaoAcaoNaoConfirmadaError);
        expect(transporte).toHaveBeenCalledTimes(1);
    });

    it('não confirma atualização com conteúdo de outra ação ou outra versão', async () => {
        transporte.mockResolvedValue({ status: 200, dados: { ...acao, acaoVersaoId: 999, pdiVersaoId: 101 } });
        await expect(atualizarAcaoPdi(10, 102, 20, campos)).rejects.toBeInstanceOf(GravacaoAcaoNaoConfirmadaError);
    });
});

describe('segurança e resultado incerto de ações', () => {
    it.each([400, 401, 403, 404, 409])('preserva HTTP %i sem repetir remoção', async (status) => {
        transporte.mockRejectedValue(new ApiError('Falha', status));
        await expect(removerAcaoPdi(10, 102, 20)).rejects.toMatchObject({ status });
        expect(transporte).toHaveBeenCalledTimes(1);
    });

    it.each([null, 500, 503, 200])('não repete remoção incerta (%j)', async (status) => {
        transporte.mockRejectedValue(new ApiError('Falha', status));
        await expect(removerAcaoPdi(10, 102, 20)).rejects.toBeInstanceOf(GravacaoAcaoNaoConfirmadaError);
        expect(transporte).toHaveBeenCalledTimes(1);
    });

    it('obtém token novo para cada gravação', async () => {
        transporte.mockResolvedValueOnce({ status: 201, dados: acao }).mockResolvedValueOnce({ status: 204, dados: null });
        vi.mocked(obterCsrf).mockResolvedValueOnce(csrf).mockResolvedValueOnce({ ...csrf, token: 'next-test-token' });
        await criarAcaoPdi(10, 102, campos);
        await removerAcaoPdi(10, 102, 20);
        expect(transporte.mock.calls[1][1]?.headers).toEqual({ 'X-CSRF-TOKEN': 'next-test-token' });
    });

    it('não inicia remoção se a preparação do token falhar', async () => {
        const erro = new ApiError('CSRF indisponível', 403);
        vi.mocked(obterCsrf).mockRejectedValue(erro);
        await expect(removerAcaoPdi(10, 102, 20)).rejects.toBe(erro);
        expect(transporte).not.toHaveBeenCalled();
    });

    it.each([0, -1, NaN, 1.5])('não chama API com versão inválida (%j)', async (versaoId) => {
        await expect(removerAcaoPdi(10, versaoId, 20)).rejects.toMatchObject({ status: 404 });
        expect(obterCsrf).not.toHaveBeenCalled();
        expect(transporte).not.toHaveBeenCalled();
    });

    it('encaminha AbortSignal e não repete requisição cancelada', async () => {
        const controller = new AbortController();
        const erro = new DOMException('Cancelada', 'AbortError');
        transporte.mockImplementation(async () => { controller.abort(); throw erro; });
        await expect(removerAcaoPdi(10, 102, 20, controller.signal)).rejects.toBe(erro);
        expect(transporte.mock.calls[0][1]?.signal).toBe(controller.signal);
        expect(transporte).toHaveBeenCalledTimes(1);
    });
});
