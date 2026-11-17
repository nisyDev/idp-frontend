import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UsuarioAutenticado } from '../services/auth';
import { ApiError } from '../services/http';
import { buscarVersao, decidirPdi, GravacaoPdiNaoConfirmadaError, listarVersoes } from '../services/pdis';
import type { PdiDecisaoResponse, PdiVersaoResponse } from '../types/pdi';
import PdiVersaoDetalhes from './PdiVersaoDetalhes';

vi.mock('../services/pdis', async (importOriginal) => {
    const original = await importOriginal<typeof import('../services/pdis')>();
    return { ...original, buscarVersao: vi.fn(), listarVersoes: vi.fn(), decidirPdi: vi.fn() };
});

vi.mock('./PdiAcoes', () => ({
    default: ({ pdi, somenteLeitura }: { pdi: { id: number; versaoId: number }; somenteLeitura?: boolean }) => (
        <div data-testid="acoes-versao">{somenteLeitura ? 'Somente leitura' : 'Editável'}: {pdi.id}/{pdi.versaoId}</div>
    ),
}));

const gestor: UsuarioAutenticado = {
    id: '22222222-2222-4222-8222-222222222222', nome: 'Gestor de teste',
    email: 'gestor@example.invalid', perfil: 'GESTOR',
};

const versao: PdiVersaoResponse = {
    id: 10, versaoId: 101, numero: 1,
    titularId: '11111111-1111-4111-8111-111111111111', gestorAtualId: gestor.id,
    versaoVigenteId: null, statusExecucao: 'NAO_INICIADO', statusAprovacao: 'AGUARDANDO_APROVACAO',
    titulo: 'Plano submetido', objetivo: 'Objetivo planejado',
    inicioPlanejado: '2026-01-01', fimPlanejado: '2026-12-31',
    criadoEm: '2026-01-01T10:00:00Z', criadaVersaoEm: '2026-01-01T10:00:00Z',
    submetidaEm: '2026-01-02T10:00:00Z', gestorNaSubmissaoId: gestor.id,
    decididaEm: null, decididoPorId: null, justificativaDecisao: null,
};

function resposta(decisao: 'APROVADO' | 'REPROVADO'): PdiDecisaoResponse {
    return {
        versaoDecidida: {
            ...versao, statusAprovacao: decisao,
            versaoVigenteId: decisao === 'APROVADO' ? versao.versaoId : null,
            decididaEm: '2026-01-03T10:00:00Z', decididoPorId: gestor.id,
            justificativaDecisao: decisao === 'REPROVADO' ? 'Corrigir planejamento' : null,
        },
        novaVersaoId: decisao === 'REPROVADO' ? 102 : null,
        novoNumero: decisao === 'REPROVADO' ? 2 : null,
    };
}

function abrir(opcoes: Partial<Parameters<typeof PdiVersaoDetalhes>[0]> = {}) {
    return render(<PdiVersaoDetalhes pdiId={10} versaoId={101} usuario={gestor} permitirDecisao
        onFechar={vi.fn()} onSessaoExpirada={vi.fn()} {...opcoes} />);
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(buscarVersao).mockReset().mockResolvedValue({ ...versao });
    vi.mocked(listarVersoes).mockReset().mockResolvedValue([{ ...versao }]);
    vi.mocked(decidirPdi).mockReset();
});

describe('consulta e decisão de versões G8', () => {
    it('consulta detalhe e histórico pelos IDs e mantém ações somente para leitura', async () => {
        abrir({ permitirDecisao: false });
        expect(await screen.findByText('Plano submetido')).toBeVisible();
        expect(buscarVersao).toHaveBeenCalledWith(10, 101, expect.any(AbortSignal));
        expect(listarVersoes).toHaveBeenCalledWith(10, expect.any(AbortSignal));
        expect(screen.getByTestId('acoes-versao')).toHaveTextContent('Somente leitura: 10/101');
        expect(screen.queryByRole('button', { name: 'Aprovar versão' })).not.toBeInTheDocument();
    });

    it('rejeita justificativa vazia sem realizar escrita nem apagar o campo', async () => {
        abrir();
        const campo = await screen.findByLabelText('Justificativa (obrigatória para rejeitar)');
        fireEvent.change(campo, { target: { value: '   ' } });
        fireEvent.click(screen.getByRole('button', { name: 'Rejeitar versão' }));
        expect(screen.getByRole('alert')).toHaveTextContent('Preencha a justificativa');
        expect(campo).toHaveValue('   ');
        expect(decidirPdi).not.toHaveBeenCalled();
    });

    it('registra rejeição e informa a revisão sem consultar seu conteúdo privado', async () => {
        vi.mocked(decidirPdi).mockResolvedValue(resposta('REPROVADO'));
        const confirmada = vi.fn();
        abrir({ onDecisaoConfirmada: confirmada });
        fireEvent.change(await screen.findByLabelText('Justificativa (obrigatória para rejeitar)'),
            { target: { value: ' Corrigir planejamento ' } });
        fireEvent.click(screen.getByRole('button', { name: 'Rejeitar versão' }));
        expect(await screen.findByText('Versão rejeitada. A revisão 2 foi criada para correção pelo titular.')).toBeVisible();
        expect(decidirPdi).toHaveBeenCalledWith(10, 101, 'reprovar', 'Corrigir planejamento', expect.any(AbortSignal));
        expect(confirmada).toHaveBeenCalledWith(resposta('REPROVADO'));
        expect(buscarVersao).toHaveBeenCalledTimes(1);
        expect(buscarVersao).not.toHaveBeenCalledWith(10, 102, expect.anything());
    });

    it('aprova sem justificativa e usa a versão vigente confirmada pelo servidor', async () => {
        vi.mocked(decidirPdi).mockResolvedValue(resposta('APROVADO'));
        abrir();
        fireEvent.click(await screen.findByRole('button', { name: 'Aprovar versão' }));
        expect(await screen.findByText('Versão aprovada e definida como vigente. A execução permanece não iniciada.')).toBeVisible();
        expect(decidirPdi).toHaveBeenCalledWith(10, 101, 'aprovar', null, expect.any(AbortSignal));
        expect(screen.getByText('Versão vigente')).toBeVisible();
        expect(screen.getByText('Não iniciado')).toBeVisible();
    });

    it('bloqueia cliques duplicados e fechamento durante a escrita', async () => {
        let concluir!: (valor: PdiDecisaoResponse) => void;
        vi.mocked(decidirPdi).mockReturnValue(new Promise((resolve) => { concluir = resolve; }));
        const fechar = vi.fn();
        abrir({ onFechar: fechar });
        const aprovar = await screen.findByRole('button', { name: 'Aprovar versão' });
        fireEvent.click(aprovar);
        fireEvent.click(aprovar);
        fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
        expect(decidirPdi).toHaveBeenCalledTimes(1);
        expect(fechar).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Rejeitar versão' })).toBeDisabled();
        await act(async () => { concluir(resposta('APROVADO')); });
        expect(screen.getByRole('button', { name: 'Fechar' })).toBeEnabled();
    });

    it('preserva justificativa e bloqueia repetição após resultado incerto, inclusive após nova leitura', async () => {
        vi.mocked(decidirPdi).mockRejectedValue(new GravacaoPdiNaoConfirmadaError());
        abrir();
        fireEvent.change(await screen.findByLabelText('Justificativa (obrigatória para rejeitar)'),
            { target: { value: 'Manter este texto' } });
        fireEvent.click(screen.getByRole('button', { name: 'Rejeitar versão' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível confirmar a decisão');
        expect(screen.getByLabelText('Justificativa (obrigatória para rejeitar)')).toHaveValue('Manter este texto');
        expect(screen.getByRole('button', { name: 'Aprovar versão' })).toBeDisabled();
        fireEvent.click(screen.getByRole('button', { name: 'Rejeitar versão' }));
        fireEvent.click(screen.getByRole('button', { name: 'Consultar situação' }));
        await waitFor(() => expect(buscarVersao).toHaveBeenCalledTimes(2));
        expect(await screen.findByRole('button', { name: 'Rejeitar versão' })).toBeDisabled();
        expect(decidirPdi).toHaveBeenCalledTimes(1);
        expect(screen.getByLabelText('Justificativa (obrigatória para rejeitar)')).toHaveValue('Manter este texto');
    });

    it('preserva justificativa e bloqueia nova decisão após conflito de versão', async () => {
        vi.mocked(decidirPdi).mockRejectedValue(new ApiError('Conflito', 409));
        abrir();
        fireEvent.change(await screen.findByLabelText('Justificativa (obrigatória para rejeitar)'),
            { target: { value: 'Texto antes do conflito' } });
        fireEvent.click(screen.getByRole('button', { name: 'Rejeitar versão' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('A versão ou sua autorização mudou');
        expect(screen.getByLabelText('Justificativa (obrigatória para rejeitar)')).toHaveValue('Texto antes do conflito');
        expect(screen.getByRole('button', { name: 'Aprovar versão' })).toBeDisabled();
        expect(screen.queryByTestId('acoes-versao')).not.toBeInTheDocument();
    });

    it('impede autodecisão mesmo para um gestor', async () => {
        abrir({ usuario: { ...gestor, id: versao.titularId } });
        expect(await screen.findByText('Você não pode decidir o próprio PDI.')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Aprovar versão' })).not.toBeInTheDocument();
        expect(decidirPdi).not.toHaveBeenCalled();
    });

    it('troca a versão consultada sem habilitar decisão de uma versão histórica', async () => {
        const historica: PdiVersaoResponse = { ...versao, versaoId: 90, numero: 1, statusAprovacao: 'REPROVADO',
            titulo: 'Planejamento histórico', decididaEm: '2025-12-01T10:00:00Z', decididoPorId: gestor.id };
        vi.mocked(listarVersoes).mockResolvedValue([versao, historica]);
        vi.mocked(buscarVersao).mockResolvedValueOnce(versao).mockResolvedValueOnce(historica);
        abrir();
        fireEvent.change(await screen.findByLabelText('Versão consultada'), { target: { value: '90' } });
        expect(await screen.findByText('Planejamento histórico')).toBeVisible();
        expect(buscarVersao).toHaveBeenLastCalledWith(10, 90, expect.any(AbortSignal));
        expect(screen.getByTestId('acoes-versao')).toHaveTextContent('Somente leitura: 10/90');
        expect(screen.queryByRole('button', { name: 'Aprovar versão' })).not.toBeInTheDocument();
    });

    it('invalida a sessão e retira os dados quando a consulta retorna 401', async () => {
        vi.mocked(buscarVersao).mockRejectedValue(new ApiError('Sessão encerrada', 401));
        const expirada = vi.fn();
        abrir({ onSessaoExpirada: expirada });
        expect(await screen.findByRole('alert')).toHaveTextContent('Sua sessão foi encerrada');
        expect(expirada).toHaveBeenCalledWith(gestor.id);
        expect(screen.queryByTestId('acoes-versao')).not.toBeInTheDocument();
    });

    it('ignora respostas de um detalhe desmontado após a seleção de outro PDI', async () => {
        let concluirAntiga!: (valor: PdiVersaoResponse) => void;
        vi.mocked(buscarVersao).mockReturnValueOnce(new Promise((resolve) => { concluirAntiga = resolve; }))
            .mockResolvedValueOnce({ ...versao, id: 20, versaoId: 201, titulo: 'Outro PDI' });
        vi.mocked(listarVersoes).mockResolvedValueOnce([versao])
            .mockResolvedValueOnce([{ ...versao, id: 20, versaoId: 201 }]);
        const props = { usuario: gestor, onFechar: vi.fn(), onSessaoExpirada: vi.fn() };
        const tela = render(<PdiVersaoDetalhes key="10" pdiId={10} versaoId={101} {...props} />);
        tela.rerender(<PdiVersaoDetalhes key="20" pdiId={20} versaoId={201} {...props} />);
        expect(await screen.findByText('Outro PDI')).toBeVisible();
        await act(async () => { concluirAntiga(versao); });
        expect(screen.queryByText('Plano submetido')).not.toBeInTheDocument();
        expect(screen.getByTestId('acoes-versao')).toHaveTextContent('Somente leitura: 20/201');
    });
});
