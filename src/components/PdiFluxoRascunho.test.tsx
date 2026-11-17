import type { ReactElement } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lightTheme, ThemeContext } from '../contexts/ThemeContext';
import { ApiError } from '../services/http';
import {
    atualizarRascunho, buscarRascunho, criarRascunho, GravacaoPdiNaoConfirmadaError,
    listarRascunhos, submeterPdi,
} from '../services/pdis';
import {
    atualizarAcaoPdi, criarAcaoPdi, GravacaoAcaoNaoConfirmadaError, listarAcoesPdi, removerAcaoPdi,
} from '../services/acoesPdi';
import type { PdiRascunhoResponse, PdiSubmetidoResponse } from '../types/pdi';
import type { AcaoPdiResponse } from '../types/acaoPdi';
import PdiFormulario from './PdiFormulario';
import AcaoPdiFormulario from './AcaoPdiFormulario';
import PdiAcoes from './PdiAcoes';
import PdiRascunhosReais from './PdiRascunhosReais';

vi.mock('../services/pdis', async () => {
    const real = await vi.importActual<typeof import('../services/pdis')>('../services/pdis');
    return { ...real, atualizarRascunho: vi.fn(), buscarRascunho: vi.fn(), criarRascunho: vi.fn(),
        listarRascunhos: vi.fn(), submeterPdi: vi.fn() };
});
vi.mock('../services/acoesPdi', async () => {
    const real = await vi.importActual<typeof import('../services/acoesPdi')>('../services/acoesPdi');
    return { ...real, atualizarAcaoPdi: vi.fn(), criarAcaoPdi: vi.fn(), listarAcoesPdi: vi.fn(), removerAcaoPdi: vi.fn() };
});

const rascunho: PdiRascunhoResponse = {
    id: 10, versaoId: 22, numeroVersao: 2, versaoVigenteId: null,
    statusAprovacao: 'RASCUNHO', statusExecucao: 'NAO_INICIADO',
    titulo: 'Plano revisado', objetivo: 'Desenvolver competências',
    inicioPlanejado: '2026-01-01', fimPlanejado: '2026-12-31',
    criadoEm: '2026-01-01T12:00:00Z', versaoCriadaEm: '2026-02-01T12:00:00Z',
};
const acao: AcaoPdiResponse = {
    id: 30, acaoVersaoId: 40, pdiId: 10, pdiVersaoId: 22,
    titulo: 'Ação revisada', objetivo: 'Aprender', resultadoEsperado: 'Apresentação',
    inicioPlanejado: null, fimPlanejado: null, ordem: 1, statusExecucao: 'NAO_INICIADA',
};
const submetido: PdiSubmetidoResponse = {
    id: 10, versaoId: 22, numero: 2, versaoVigenteId: null,
    statusExecucao: 'NAO_INICIADO', statusAprovacao: 'AGUARDANDO_APROVACAO',
    titulo: rascunho.titulo!, objetivo: rascunho.objetivo!,
    inicioPlanejado: rascunho.inicioPlanejado!, fimPlanejado: rascunho.fimPlanejado!,
    criadoEm: rascunho.criadoEm, criadaVersaoEm: rascunho.versaoCriadaEm,
    submetidaEm: '2026-02-02T12:00:00Z', gestorNaSubmissaoId: '00000000-0000-0000-0000-000000000002',
};
const usuario = { id: '00000000-0000-0000-0000-000000000001', nome: 'Pessoa de teste',
    email: 'pessoa@example.invalid', perfil: 'COLABORADOR' as const };

function montar(elemento: ReactElement) {
    return render(<ThemeContext.Provider value={{ theme: lightTheme, mode: 'light', toggleTheme: vi.fn() }}>
        {elemento}
    </ThemeContext.Provider>);
}
function pendente<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((resolver) => { resolve = resolver; });
    return { promise, resolve };
}

beforeEach(() => {
    for (const funcao of [atualizarRascunho, buscarRascunho, criarRascunho, listarRascunhos,
        submeterPdi, atualizarAcaoPdi, criarAcaoPdi, listarAcoesPdi, removerAcaoPdi]) {
        vi.mocked(funcao).mockReset();
    }
    vi.mocked(buscarRascunho).mockResolvedValue({ ...rascunho });
    vi.mocked(listarRascunhos).mockResolvedValue([{ ...rascunho }]);
    vi.mocked(listarAcoesPdi).mockResolvedValue([{ ...acao }]);
});

describe('rascunhos e revisões G9', () => {
    it('cria o PDI com os campos preenchidos e informa apenas o resultado confirmado', async () => {
        const criado = { ...rascunho, numeroVersao: 1 };
        vi.mocked(criarRascunho).mockResolvedValue(criado);
        const salvo = vi.fn();
        montar(<PdiFormulario modo="criacao" onFechar={vi.fn()} onSalvo={salvo} onSessaoExpirada={vi.fn()} />);
        fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Plano revisado' } });
        fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
        await waitFor(() => expect(salvo).toHaveBeenCalledWith(criado, 'criacao'));
        expect(criarRascunho).toHaveBeenCalledWith(expect.objectContaining({ titulo: 'Plano revisado' }), expect.any(AbortSignal));
    });

    it('edita a revisão posterior à primeira usando a versão carregada, sem confundir número e ID', async () => {
        vi.mocked(atualizarRascunho).mockResolvedValue({ ...rascunho, titulo: 'Correção final' });
        montar(<PdiFormulario modo="edicao" pdiId={10} onFechar={vi.fn()} onSalvo={vi.fn()} onSessaoExpirada={vi.fn()} />);
        await screen.findByDisplayValue('Plano revisado');
        fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Correção final' } });
        fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
        await waitFor(() => expect(atualizarRascunho).toHaveBeenCalledWith(10, 22,
            expect.objectContaining({ titulo: 'Correção final' }), expect.any(AbortSignal)));
    });

    it('preserva campos e bloqueia repetição após uma gravação de PDI incerta', async () => {
        vi.mocked(atualizarRascunho).mockRejectedValue(new GravacaoPdiNaoConfirmadaError());
        const salvo = vi.fn();
        montar(<PdiFormulario modo="edicao" pdiId={10} onFechar={vi.fn()} onSalvo={salvo} onSessaoExpirada={vi.fn()} />);
        await screen.findByDisplayValue('Plano revisado');
        fireEvent.change(screen.getByLabelText('Objetivo'), { target: { value: 'Meu texto preservado' } });
        fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
        await screen.findByRole('alert');
        expect(screen.getByLabelText('Objetivo')).toHaveValue('Meu texto preservado');
        expect(screen.getByRole('button', { name: 'Salvar rascunho' })).toBeDisabled();
        fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
        expect(atualizarRascunho).toHaveBeenCalledTimes(1);
        expect(salvo).not.toHaveBeenCalled();
    });

    it('bloqueia edição quando a consulta retorna versão já submetida', async () => {
        vi.mocked(buscarRascunho).mockResolvedValue({ ...rascunho, statusAprovacao: 'AGUARDANDO_APROVACAO' });
        montar(<PdiFormulario modo="edicao" pdiId={10} onFechar={vi.fn()} onSalvo={vi.fn()} onSessaoExpirada={vi.fn()} />);
        await screen.findByDisplayValue('Plano revisado');
        expect(screen.getByRole('button', { name: 'Salvar rascunho' })).toBeDisabled();
        expect(atualizarRascunho).not.toHaveBeenCalled();
    });

    it('ressubmete a revisão com uma única chamada e retira somente o rascunho confirmado', async () => {
        const envio = pendente<PdiSubmetidoResponse>();
        vi.mocked(submeterPdi).mockReturnValue(envio.promise);
        montar(<PdiRascunhosReais usuario={usuario} onSessaoExpirada={vi.fn()} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Submeter Plano revisado' }));
        const confirmar = within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar submissão' });
        fireEvent.click(confirmar);
        fireEvent.click(confirmar);
        expect(submeterPdi).toHaveBeenCalledTimes(1);
        expect(submeterPdi).toHaveBeenCalledWith(10, 22, expect.any(AbortSignal));
        vi.mocked(listarRascunhos).mockResolvedValue([]);
        await act(async () => { envio.resolve(submetido); });
        await screen.findByText(/Versão 2 submetida com sucesso/);
        expect(screen.queryByRole('button', { name: 'Submeter Plano revisado' })).not.toBeInTheDocument();
    });

    it('preserva o PDI e impede novo envio quando a submissão é incerta', async () => {
        vi.mocked(submeterPdi).mockRejectedValue(new GravacaoPdiNaoConfirmadaError());
        montar(<PdiRascunhosReais usuario={usuario} onSessaoExpirada={vi.fn()} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Submeter Plano revisado' }));
        fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar submissão' }));
        await screen.findByRole('alert');
        expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar submissão' })).toBeDisabled();
        expect(screen.getByRole('heading', { name: 'Plano revisado' })).toBeInTheDocument();
        expect(submeterPdi).toHaveBeenCalledTimes(1);
        expect(listarRascunhos).toHaveBeenCalledTimes(1);
    });

    it('trata conflito de submissão sem confirmar sucesso ou repetir a escrita', async () => {
        vi.mocked(submeterPdi).mockRejectedValue(new ApiError('Conflito', 409));
        montar(<PdiRascunhosReais usuario={usuario} onSessaoExpirada={vi.fn()} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Submeter Plano revisado' }));
        fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar submissão' }));
        await screen.findByText(/Esta versão mudou/);
        expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar submissão' })).toBeDisabled();
        expect(screen.queryByText(/submetida com sucesso/)).not.toBeInTheDocument();
        expect(submeterPdi).toHaveBeenCalledTimes(1);
    });

    it('informa a identidade correta ao detectar sessão expirada na listagem', async () => {
        vi.mocked(listarRascunhos).mockRejectedValue(new ApiError('Sessão expirada', 401));
        const expirada = vi.fn();
        montar(<PdiRascunhosReais usuario={usuario} onSessaoExpirada={expirada} />);
        await waitFor(() => expect(expirada).toHaveBeenCalledWith(usuario.id));
        expect(screen.getByRole('button', { name: /Novo PDI/ })).toBeDisabled();
    });
});

describe('ações e preservação de versões', () => {
    it('cria ação na revisão 2 com a identidade de versão vigente no formulário', async () => {
        vi.mocked(criarAcaoPdi).mockResolvedValue(acao);
        const salvo = vi.fn();
        montar(<AcaoPdiFormulario pdi={rascunho} onFechar={vi.fn()} onSalvo={salvo} onSessaoExpirada={vi.fn()} />);
        fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Ação revisada' } });
        fireEvent.click(screen.getByRole('button', { name: 'Salvar ação' }));
        await waitFor(() => expect(salvo).toHaveBeenCalledWith(acao, 'criacao'));
        expect(criarAcaoPdi).toHaveBeenCalledWith(10, 22, expect.objectContaining({ titulo: 'Ação revisada' }), expect.any(AbortSignal));
    });

    it('edita os dados da ação copiada preservando seus IDs de PDI e versão', async () => {
        vi.mocked(atualizarAcaoPdi).mockResolvedValue({ ...acao, objetivo: 'Objetivo corrigido' });
        montar(<AcaoPdiFormulario pdi={rascunho} acao={acao} onFechar={vi.fn()} onSalvo={vi.fn()} onSessaoExpirada={vi.fn()} />);
        fireEvent.change(screen.getByLabelText('Objetivo'), { target: { value: 'Objetivo corrigido' } });
        fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
        await waitFor(() => expect(atualizarAcaoPdi).toHaveBeenCalledWith(10, 22, 30,
            expect.objectContaining({ objetivo: 'Objetivo corrigido' }), expect.any(AbortSignal)));
    });

    it('preserva campos da ação após resposta incerta sem repetir automaticamente', async () => {
        vi.mocked(atualizarAcaoPdi).mockRejectedValue(new GravacaoAcaoNaoConfirmadaError());
        montar(<AcaoPdiFormulario pdi={rascunho} acao={acao} onFechar={vi.fn()} onSalvo={vi.fn()} onSessaoExpirada={vi.fn()} />);
        fireEvent.change(screen.getByLabelText('Resultado esperado'), { target: { value: 'Resultado preservado' } });
        fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
        await screen.findByRole('alert');
        expect(screen.getByLabelText('Resultado esperado')).toHaveValue('Resultado preservado');
        expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled();
        expect(atualizarAcaoPdi).toHaveBeenCalledTimes(1);
    });

    it('consulta ações de versão histórica sem disponibilizar edição ou remoção', async () => {
        montar(<PdiAcoes pdi={{ id: 10, versaoId: 22 }} somenteLeitura bloqueado={false} onSessaoExpirada={vi.fn()} />);
        await screen.findByRole('heading', { name: 'Ação revisada' });
        expect(listarAcoesPdi).toHaveBeenCalledWith(10, 22, expect.any(AbortSignal));
        expect(screen.queryByRole('button', { name: /Editar ação/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Remover ação/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Nova ação/ })).not.toBeInTheDocument();
    });

    it('confirma remoção uma única vez e reconcilia a contagem de ações ativas', async () => {
        vi.mocked(removerAcaoPdi).mockResolvedValue(undefined);
        montar(<PdiAcoes pdi={rascunho} bloqueado={false} onSessaoExpirada={vi.fn()} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Remover ação Ação revisada' }));
        vi.mocked(listarAcoesPdi).mockResolvedValue([]);
        fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar remoção' }));
        await screen.findByText('Ação removida deste rascunho com sucesso.');
        await screen.findByText(/Esta versão não possui ações ativas/);
        expect(removerAcaoPdi).toHaveBeenCalledTimes(1);
        expect(removerAcaoPdi).toHaveBeenCalledWith(10, 22, 30, expect.any(AbortSignal));
    });

    it('mantém a ação exibida e bloqueia repetição após remoção incerta', async () => {
        vi.mocked(removerAcaoPdi).mockRejectedValue(new GravacaoAcaoNaoConfirmadaError());
        montar(<PdiAcoes pdi={rascunho} bloqueado={false} onSessaoExpirada={vi.fn()} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Remover ação Ação revisada' }));
        fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar remoção' }));
        await screen.findByRole('alert');
        expect(screen.getByRole('heading', { name: 'Ação revisada' })).toBeInTheDocument();
        expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar remoção' })).toBeDisabled();
        expect(removerAcaoPdi).toHaveBeenCalledTimes(1);
        expect(listarAcoesPdi).toHaveBeenCalledTimes(1);
    });

    it('não libera ações de escrita quando a consulta é negada', async () => {
        vi.mocked(listarAcoesPdi).mockRejectedValue(new ApiError('Operação não autorizada', 403));
        montar(<PdiAcoes pdi={rascunho} bloqueado={false} onSessaoExpirada={vi.fn()} />);
        await screen.findByRole('alert');
        expect(screen.getByRole('button', { name: /Nova ação/ })).toBeDisabled();
        expect(screen.queryByRole('button', { name: /Remover ação/ })).not.toBeInTheDocument();
    });
});
