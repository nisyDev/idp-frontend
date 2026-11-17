import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { ThemeProvider } from '../contexts/ThemeContext';
import DashboardPage from './DashboardPage';

it('mantém os cartões com apresentação neutra para indicadores de PDI não carregados', () => {
    render(<ThemeProvider><DashboardPage nomeUsuario="Pessoa de teste" perfil="COLABORADOR" /></ThemeProvider>);
    expect(screen.getByText('Meus PDIs — consulte a área PDI')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('45%')).not.toBeInTheDocument();
    expect(screen.getByText('Não disponível')).toBeInTheDocument();
});
