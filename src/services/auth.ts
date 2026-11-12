import { ApiError, requisitarApiComSessao } from './http';

export type PerfilAutenticado = 'COLABORADOR' | 'GESTOR' | 'RH_ADMIN';

export interface UsuarioAutenticado {
    id: string;
    nome: string;
    email: string;
    perfil: PerfilAutenticado;
}

interface CsrfResponse {
    headerName: string;
    parameterName: string;
    token: string;
}

function objeto(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export async function obterCsrf(signal?: AbortSignal): Promise<CsrfResponse> {
    const response = await requisitarApiComSessao('/api/csrf', { signal });
    const csrf = response.dados;
    if (response.status !== 200 || !objeto(csrf)
        || typeof csrf.headerName !== 'string' || !/^X-[A-Z0-9-]+$/i.test(csrf.headerName)
        || typeof csrf.parameterName !== 'string' || !csrf.parameterName
        || typeof csrf.token !== 'string' || !csrf.token || /[\r\n]/.test(csrf.token)) {
        throw new ApiError('Não foi possível preparar uma solicitação segura. Tente novamente.');
    }
    return { headerName: csrf.headerName, parameterName: csrf.parameterName, token: csrf.token };
}

/** A missing session is different from an unavailable server or invalid JSON. */
export async function consultarSessao(signal?: AbortSignal): Promise<UsuarioAutenticado | null> {
    let response: { status: number; dados: unknown };
    try {
        response = await requisitarApiComSessao('/api/auth/me', { signal });
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
    }

    const usuario = response.dados;
    if (response.status !== 200 || !objeto(usuario)
        || typeof usuario.id !== 'string'
        || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usuario.id)
        || typeof usuario.nome !== 'string' || !usuario.nome.trim()
        || typeof usuario.email !== 'string' || !usuario.email.trim()
        || (usuario.perfil !== 'COLABORADOR' && usuario.perfil !== 'GESTOR' && usuario.perfil !== 'RH_ADMIN')) {
        throw new ApiError('Não foi possível confirmar a identidade autenticada.');
    }

    // Copy only the four fields in the server's identity contract.
    return { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil };
}

export async function autenticar(
    email: string,
    senha: string,
    lembrarAcesso: boolean,
    signal?: AbortSignal,
): Promise<UsuarioAutenticado> {
    const csrf = await obterCsrf(signal);
    let response: { status: number; dados: unknown };
    try {
        response = await requisitarApiComSessao('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                [csrf.headerName]: csrf.token,
            },
            body: new URLSearchParams({ email, password: senha, lembrarAcesso: String(lembrarAcesso) }),
            signal,
        });
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            throw new ApiError('E-mail ou senha inválidos.', 401);
        }
        throw error;
    }
    if (response.status !== 204) throw new ApiError('Não foi possível confirmar o login.');

    try {
        // Spring Security rotates the session and clears the pre-login CSRF token.
        await obterCsrf(signal);
        const usuario = await consultarSessao(signal);
        if (usuario) return usuario;
    } catch (error) {
        if (signal?.aborted) throw error;
        throw new ApiError('Não foi possível confirmar a sessão após o login. Tente novamente.');
    }
    throw new ApiError('Não foi possível confirmar a sessão após o login. Tente novamente.');
}

export async function encerrarSessao(signal?: AbortSignal): Promise<void> {
    // Always obtain the current token; never reuse a token from before login/logout.
    const csrf = await obterCsrf(signal);
    const response = await requisitarApiComSessao('/api/auth/logout', {
        method: 'POST',
        headers: { [csrf.headerName]: csrf.token },
        signal,
    });
    if (response.status !== 204) throw new ApiError('Não foi possível confirmar a saída. Tente novamente.');
    // The next login obtains a new CSRF token for its new anonymous session.
}
