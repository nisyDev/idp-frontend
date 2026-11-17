import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, requisitarApiComSessao } from './http';

const fetchSimulado = vi.fn<typeof fetch>();

beforeEach(() => {
    fetchSimulado.mockReset();
    vi.stubGlobal('fetch', fetchSimulado);
});

afterEach(() => { vi.useRealTimers(); });

describe('transporte autenticado G9', () => {
    it('preserva query de versão, cookie, CSRF e DELETE com resposta 204', async () => {
        fetchSimulado.mockResolvedValue(new Response(null, { status: 204 }));
        await expect(requisitarApiComSessao('/api/pdis/7/acoes/3?versaoId=12', {
            method: 'DELETE', headers: { 'X-CSRF-TOKEN': 'token-ficticio' },
        })).resolves.toEqual({ status: 204, dados: null });
        expect(fetchSimulado).toHaveBeenCalledOnce();
        expect(fetchSimulado).toHaveBeenCalledWith('/api/pdis/7/acoes/3?versaoId=12', expect.objectContaining({
            method: 'DELETE', credentials: 'same-origin', mode: 'same-origin',
            cache: 'no-store', redirect: 'error',
            headers: expect.objectContaining({ 'X-CSRF-TOKEN': 'token-ficticio' }),
        }));
    });

    it.each([400, 401, 403, 404, 409, 500])('trata HTTP %s sem exibir corpo bruto e sem repetir a solicitação', async (status) => {
        fetchSimulado.mockResolvedValue(new Response('mensagem interna que nao deve ser exibida', { status }));
        const erro = await requisitarApiComSessao('/api/pdis/7', { method: 'PUT' }).catch((error: unknown) => error);
        expect(erro).toBeInstanceOf(ApiError);
        expect(erro).toMatchObject({ status });
        expect((erro as ApiError).message).not.toContain('mensagem interna');
        expect(fetchSimulado).toHaveBeenCalledOnce();
    });

    it('rejeita resposta JSON inválida sem declarar sucesso', async () => {
        fetchSimulado.mockResolvedValue(new Response('html inesperado', { status: 200 }));
        await expect(requisitarApiComSessao('/api/pdis')).rejects.toMatchObject({ status: 200 });
        expect(fetchSimulado).toHaveBeenCalledOnce();
    });

    it('rejeita caminho fora da API antes do transporte', async () => {
        await expect(requisitarApiComSessao('/api/../fora')).rejects.toBeInstanceOf(ApiError);
        expect(fetchSimulado).not.toHaveBeenCalled();
    });

    it('cancela leitura obsoleta sem reapresentá-la como resultado válido', async () => {
        fetchSimulado.mockImplementation((_url, options) => new Promise((_resolve, reject) => {
            options?.signal?.addEventListener('abort', () => reject(new DOMException('Abortado', 'AbortError')));
        }));
        const controller = new AbortController();
        const resultado = expect(requisitarApiComSessao('/api/pdis', { signal: controller.signal }))
            .rejects.toMatchObject({ name: 'AbortError' });
        controller.abort();
        await resultado;
        expect(fetchSimulado).toHaveBeenCalledOnce();
    });

    it('timeout de escrita não dispara nova tentativa', async () => {
        vi.useFakeTimers();
        fetchSimulado.mockImplementation((_url, options) => new Promise((_resolve, reject) => {
            options?.signal?.addEventListener('abort', () => reject(new DOMException('Abortado', 'AbortError')));
        }));
        const resultado = expect(requisitarApiComSessao('/api/pdis/7/submeter?versaoId=12', { method: 'POST' }))
            .rejects.toMatchObject({ status: null });
        await vi.advanceTimersByTimeAsync(20_000);
        await resultado;
        expect(fetchSimulado).toHaveBeenCalledOnce();
    });
});
