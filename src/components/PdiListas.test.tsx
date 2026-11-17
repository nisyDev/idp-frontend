import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../contexts/ThemeContext';
import type { UsuarioAutenticado } from '../services/auth';
import { ApiError } from '../services/http';
import { listarPendentes, listarSubmetidos } from '../services/pdis';
import type { PdiDecisaoResponse, PdiSubmetidoResponse, PdiVersaoResponse } from '../types/pdi';
import PdiPendentes from './PdiPendentes';
import PdiSubmetidos from './PdiSubmetidos';

vi.mock('../services/pdis', async (importOriginal) => {
    const original = await importOriginal<typeof import('../services/pdis')>();
    return { ...original, listarPendentes: vi.fn(), listarSubmetidos: vi.fn() };
});

vi.mock('./PdiVersaoDetalhes', () => ({
    default: ({ pdiId, versaoId, permitirDecisao, onFechar, onDecisaoConfirmada }: {
        pdiId: number; versaoId: number; permitirDecisao?: boolean;
        onFechar: () => void; onDecisaoConfirmada?: (resposta: PdiDecisaoResponse) => void;
    }) => (
        <div role="dialog" aria-label="Detalhe de teste">
            <p>Detalhe {pdiId}/{versaoId}</p>
            {permitirDecisao && <button type="button" onClick={() => onDecisaoConfirmada?.({
                versaoDecidida: { ...versao, statusAprovacao: 'APROVADO', versaoVigenteId: versaoId,
                    decididaEm: '2026-01-03T10:00:00Z', decididoPorId: gestor.id },
                novaVersaoId: null, novoNumero: null,
            })}>Registrar aprovação de teste</button>}
            <button type="button" onClick={onFechar}>Fechar detalhe de teste</button>
        </div>
    ),
}));

const gestor: UsuarioAutenticado = {
    id: '22222222-2222-4222-8222-222222222222', nome: 'Gestor de teste',
    email: 'gestor@example.invalid', perfil: 'GESTOR',
};

const colaborador: UsuarioAutenticado = {
    id: '11111111-1111-4111-8111-111111111111', nome: 'Colaborador de teste',
    email: 'colaborador@example.invalid', perfil: 'COLABORADOR',
};

const versao: PdiVersaoResponse = {
    id: 10, versaoId: 101, numero: 1, titularId: colaborador.id, gestorAtualId: gestor.id,
    versaoVigenteId: null, statusExecucao: 'NAO_INICIADO', statusAprovacao: 'AGUARDANDO_APROVACAO',
    titulo: 'Plano pendente', objetivo: 'Planejamento de teste', inicioPlanejado: null, fimPlanejado: null,
    criadoEm: '2026-01-01T10:00:00Z', criadaVersaoEm: '2026-01-01T10:00:00Z',
    submetidaEm: '2026-01-02T10:00:00Z', gestorNaSubmissaoId: gestor.id,
    decididaEm: null, decididoPorId: null, justificativaDecisao: null,
};

const submetida: PdiSubmetidoResponse = {
    id: 10, versaoId: 101, numero: 1, versaoVigenteId: 102,
    statusExecucao: 'NAO_INICIADO', statusAprovacao: 'REPROVADO',
    titulo: 'Planejamento anterior', objetivo: 'Planejamento de teste', inicioPlanejado: null, fimPlanejado: null,
    criadoEm: '2026-01-01T10:00:00Z', criadaVersaoEm: '2026-01-01T10:00:00Z',
    submetidaEm: '2026-01-02T10:00:00Z', gestorNaSubmissaoId: gestor.id,
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listarSubmetidos).mockReset().mockResolvedValue([submetida]);
    vi.mocked(listarPendentes).mockReset().mockResolvedValue([versao]);
});

describe('submetidos e pendências', () => {
    it('consulta submetidos reais e abre a vigente pelo ID retornado, mantendo a versão histórica', async () => {
        render(<ThemeProvider><PdiSubmetidos usuario={colaborador} onSessaoExpirada={vi.fn()} /></ThemeProvider>);
        expect(await screen.findByText('Planejamento anterior')).toBeVisible();
        expect(screen.getByText('Reprovado')).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: 'Consultar vigente' }));
        expect(screen.getByRole('dialog')).toHaveTextContent('Detalhe 10/102');
        expect(screen.queryByRole('button', { name: 'Registrar aprovação de teste' })).not.toBeInTheDocument();
    });

    it('mantém os números e IDs de cada versão submetida sem tratar número como identidade', async () => {
        vi.mocked(listarSubmetidos).mockResolvedValue([
            submetida,
            { ...submetida, versaoId: 102, numero: 2, statusAprovacao: 'APROVADO', titulo: 'Planejamento vigente' },
        ]);
        render(<ThemeProvider><PdiSubmetidos usuario={colaborador} onSessaoExpirada={vi.fn()} /></ThemeProvider>);
        fireEvent.click(await screen.findByRole('button', { name: 'Ver versão 2' }));
        expect(screen.getByRole('dialog')).toHaveTextContent('Detalhe 10/102');
        expect(screen.getByText('Planejamento anterior')).toBeVisible();
    });

    it('apresenta lista vazia apenas após uma resposta vazia confirmada', async () => {
        vi.mocked(listarSubmetidos).mockResolvedValue([]);
        render(<ThemeProvider><PdiSubmetidos usuario={colaborador} onSessaoExpirada={vi.fn()} /></ThemeProvider>);
        expect(await screen.findByText('Nenhuma versão submetida')).toBeVisible();
        expect(screen.queryByText('Planejamento anterior')).not.toBeInTheDocument();
    });

    it('trata RH sem autorização efetiva como acesso negado e não como fila vazia', async () => {
        vi.mocked(listarPendentes).mockRejectedValue(new ApiError('Operação não autorizada', 403));
        render(<ThemeProvider><PdiPendentes usuario={{ ...gestor, perfil: 'RH_ADMIN' }}
            onSessaoExpirada={vi.fn()} /></ThemeProvider>);
        expect(await screen.findByRole('alert')).toHaveTextContent('Acesso não autorizado');
        expect(screen.queryByText('Nenhum PDI pendente')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Consultar e decidir' })).not.toBeInTheDocument();
    });

    it('não consulta pendências para um colaborador', () => {
        render(<ThemeProvider><PdiPendentes usuario={colaborador} onSessaoExpirada={vi.fn()} /></ThemeProvider>);
        expect(screen.getByRole('alert')).toHaveTextContent('Seu perfil não permite decidir PDIs');
        expect(listarPendentes).not.toHaveBeenCalled();
    });

    it('atualiza pendências somente após uma decisão confirmada e não consulta novo rascunho', async () => {
        vi.mocked(listarPendentes).mockResolvedValueOnce([versao]).mockResolvedValue([]);
        render(<ThemeProvider><PdiPendentes usuario={gestor} onSessaoExpirada={vi.fn()} /></ThemeProvider>);
        fireEvent.click(await screen.findByRole('button', { name: 'Consultar e decidir' }));
        expect(screen.getByRole('dialog')).toHaveTextContent('Detalhe 10/101');
        fireEvent.click(screen.getByRole('button', { name: 'Registrar aprovação de teste' }));
        expect(await screen.findByText('Aprovação registrada com sucesso.')).toBeVisible();
        await waitFor(() => expect(listarPendentes).toHaveBeenCalledTimes(2));
        expect(screen.queryByRole('button', { name: 'Consultar e decidir' })).not.toBeInTheDocument();
        expect(listarSubmetidos).not.toHaveBeenCalled();
    });

    it('comunica sessão expirada nas pendências sem exibir dados do titular', async () => {
        vi.mocked(listarPendentes).mockRejectedValue(new ApiError('Sua sessão não está ativa.', 401));
        const expirada = vi.fn();
        render(<ThemeProvider><PdiPendentes usuario={gestor} onSessaoExpirada={expirada} /></ThemeProvider>);
        expect(await screen.findByRole('alert')).toHaveTextContent('Sua sessão não está ativa');
        expect(expirada).toHaveBeenCalledWith(gestor.id);
        expect(screen.queryByText('Plano pendente')).not.toBeInTheDocument();
    });

    it('cancela consulta antiga e ignora sua resposta após mudança de identidade', async () => {
        let concluirAntiga!: (valor: PdiSubmetidoResponse[]) => void;
        vi.mocked(listarSubmetidos).mockReturnValueOnce(new Promise((resolve) => { concluirAntiga = resolve; }))
            .mockResolvedValueOnce([{ ...submetida, id: 20, versaoId: 201, titulo: 'Outro titular' }]);
        const expirada = vi.fn();
        const tela = render(<ThemeProvider><PdiSubmetidos usuario={colaborador} onSessaoExpirada={expirada} /></ThemeProvider>);
        const signalAntigo = vi.mocked(listarSubmetidos).mock.calls[0][0];
        tela.rerender(<ThemeProvider><PdiSubmetidos usuario={{ ...colaborador, id: '33333333-3333-4333-8333-333333333333' }}
            onSessaoExpirada={expirada} /></ThemeProvider>);
        expect(await screen.findByText('Outro titular')).toBeVisible();
        await act(async () => { concluirAntiga([submetida]); });
        expect(signalAntigo?.aborted).toBe(true);
        expect(screen.queryByText('Planejamento anterior')).not.toBeInTheDocument();
    });
});
