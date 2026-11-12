import type { UsuarioAutenticado } from '../services/auth';
import PdiRascunhosReais from '../components/PdiRascunhosReais';

interface PdiPageProps {
    usuario: UsuarioAutenticado;
    onSessaoExpirada: (usuarioId: string) => void;
}

export default function PdiPage({ usuario, onSessaoExpirada }: PdiPageProps) {
    return (
        <PdiRascunhosReais
            key={usuario.id}
            usuario={usuario}
            onSessaoExpirada={onSessaoExpirada}
        />
    );
}
