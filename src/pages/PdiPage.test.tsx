import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../contexts/ThemeContext';
import type { UsuarioAutenticado } from '../services/auth';
import PdiPage from './PdiPage';

vi.mock('../components/PdiRascunhosReais', () => ({ default: () => <p>Área de rascunhos reais</p> }));
vi.mock('../components/PdiSubmetidos', () => ({ default: () => <p>Área de submetidos reais</p> }));
vi.mock('../components/PdiPendentes', () => ({ default: () => <p>Área de pendências autorizadas pelo servidor</p> }));

const pessoa: UsuarioAutenticado = {
    id: '00000000-0000-4000-8000-000000000001', nome: 'Pessoa de teste',
    email: 'pessoa@example.invalid', perfil: 'COLABORADOR',
};

describe('navegação do fluxo PDI', () => {
    it('colaborador consulta rascunhos e decisões sem área de decisão', () => {
        render(<ThemeProvider><PdiPage usuario={pessoa} onSessaoExpirada={vi.fn()} /></ThemeProvider>);
        expect(screen.getByText('Área de rascunhos reais')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Pendências de aprovação' })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Submetidos e decisões' }));
        expect(screen.getByText('Área de submetidos reais')).toBeInTheDocument();
    });

    it.each(['GESTOR', 'RH_ADMIN'] as const)('%s consulta a área sujeita à autorização do servidor', (perfil) => {
        render(<ThemeProvider><PdiPage usuario={{ ...pessoa, perfil }} onSessaoExpirada={vi.fn()} /></ThemeProvider>);
        fireEvent.click(screen.getByRole('button', { name: 'Pendências de aprovação' }));
        expect(screen.getByText('Área de pendências autorizadas pelo servidor')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Meus rascunhos' }));
        expect(screen.getByText('Área de rascunhos reais')).toBeInTheDocument();
    });
});
