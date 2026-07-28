const API_BASE_URL = 'http://localhost:8080/api';

export interface Cargo {
    id: string;
    nome: string;
    nivel: string;
    ativo: boolean;
}

export interface Usuario {
    id: string;
    nome: string;
    email: string;
    cargo: Cargo;
    perfilAcesso: string;
    ativo: boolean;
}

export interface PDI {
    id: string;
    usuario: Usuario;
    titulo: string;
    objetivo: string;
    prazo: string;
    statusPdi: string;
}

export async function getPdis(): Promise<PDI[]> {
    const response = await fetch(`${API_BASE_URL}/pdis`);
    if (!response.ok) {
        throw new Error('Erro ao buscar PDIs');
    }
    return response.json();
}