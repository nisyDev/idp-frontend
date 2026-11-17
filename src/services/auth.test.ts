import { beforeEach, describe, expect, it, vi } from 'vitest';
import { autenticar, consultarSessao, encerrarSessao } from './auth';
import { ApiError, requisitarApiComSessao } from './http';

vi.mock('./http', async (importOriginal) => {
    const original = await importOriginal<typeof import('./http')>();
    return { ...original, requisitarApiComSessao: vi.fn() };
});

const requisitar = vi.mocked(requisitarApiComSessao);
const usuario = {
    id: '00000000-0000-4000-8000-000000000001',
    nome: 'Pessoa de teste', email: 'pessoa@example.invalid', perfil: 'COLABORADOR',
};
const token = (value: string) => ({ status: 200, dados: { token: value, headerName: 'X-CSRF-TOKEN', parameterName: '_csrf' } });

beforeEach(() => { requisitar.mockReset(); });

describe('regressão da sessão e CSRF', () => {
    it('renova o token após login e obtém o token vigente novamente para logout', async () => {
        requisitar.mockResolvedValueOnce(token('antes-login'))
            .mockResolvedValueOnce({ status: 204, dados: null })
            .mockResolvedValueOnce(token('depois-login'))
            .mockResolvedValueOnce({ status: 200, dados: usuario })
            .mockResolvedValueOnce(token('antes-logout'))
            .mockResolvedValueOnce({ status: 204, dados: null });
        await expect(autenticar(usuario.email, 'somente-teste', false)).resolves.toEqual(usuario);
        await encerrarSessao();
        expect(requisitar).toHaveBeenNthCalledWith(2, '/api/auth/login', expect.objectContaining({
            method: 'POST', headers: expect.objectContaining({ 'X-CSRF-TOKEN': 'antes-login' }),
        }));
        expect(requisitar).toHaveBeenNthCalledWith(3, '/api/csrf', expect.any(Object));
        expect(requisitar).toHaveBeenNthCalledWith(6, '/api/auth/logout', expect.objectContaining({
            method: 'POST', headers: { 'X-CSRF-TOKEN': 'antes-logout' },
        }));
        expect(requisitar).toHaveBeenCalledTimes(6);
    });

    it('diferencia sessão ausente de servidor indisponível', async () => {
        requisitar.mockRejectedValueOnce(new ApiError('Sessão ausente', 401));
        await expect(consultarSessao()).resolves.toBeNull();
        requisitar.mockRejectedValueOnce(new ApiError('Indisponível', 503));
        await expect(consultarSessao()).rejects.toMatchObject({ status: 503 });
    });

    it('rejeita identidade sem perfil reconhecido', async () => {
        requisitar.mockResolvedValue({ status: 200, dados: { ...usuario, perfil: 'ADMIN' } });
        await expect(consultarSessao()).rejects.toBeInstanceOf(ApiError);
    });

    it('login negado não consulta identidade nem repete a escrita', async () => {
        requisitar.mockResolvedValueOnce(token('csrf-login')).mockRejectedValueOnce(new ApiError('Negado', 401));
        await expect(autenticar(usuario.email, 'somente-teste', false)).rejects.toMatchObject({ status: 401 });
        expect(requisitar).toHaveBeenCalledTimes(2);
    });
});
