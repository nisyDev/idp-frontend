export class ApiError extends Error {
    readonly status: number | null;

    constructor(message: string, status: number | null = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

interface RequisicaoComSessao {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: URLSearchParams | string;
    signal?: AbortSignal;
}

/** Session authentication uses relative API calls; the browser owns the cookie. */
export async function requisitarApiComSessao(
    path: `/api/${string}`,
    options: RequisicaoComSessao = {},
): Promise<{ status: number; dados: unknown }> {
    const url = new URL(path, window.location.origin);
    if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) {
        throw new ApiError('Endereço da API inválido.');
    }

    const controller = new AbortController();
    const cancelar = () => controller.abort();
    options.signal?.addEventListener('abort', cancelar, { once: true });
    if (options.signal?.aborted) controller.abort();
    const timeout = window.setTimeout(cancelar, 20_000);

    try {
        const response = await fetch(url.pathname + url.search, {
            method: options.method ?? 'GET',
            headers: { Accept: 'application/json', ...options.headers },
            body: options.body,
            signal: controller.signal,
            credentials: 'same-origin',
            mode: 'same-origin',
            cache: 'no-store',
            redirect: 'error',
        });

        // Never display raw response bodies or server exception messages.
        if (response.status === 401) {
            throw new ApiError('Sua sessão não está ativa. Entre novamente.', 401);
        }
        if (response.status === 403) {
            throw new ApiError('A solicitação não foi autorizada. Tente novamente.', 403);
        }
        if (!response.ok) {
            throw new ApiError('Não foi possível concluir a solicitação. Tente novamente.', response.status);
        }
        if (response.status === 204) return { status: response.status, dados: null };

        let dados: unknown;
        try {
            dados = await response.json();
        } catch {
            throw new ApiError('O servidor retornou uma resposta inválida.', response.status);
        }
        return { status: response.status, dados };
    } catch (error) {
        if (options.signal?.aborted) {
            throw new DOMException('Requisição cancelada.', 'AbortError');
        }
        if (controller.signal.aborted) {
            throw new ApiError('O servidor demorou para responder. Tente novamente.');
        }
        if (error instanceof ApiError) throw error;
        throw new ApiError('Não foi possível comunicar com o servidor. Tente novamente.');
    } finally {
        window.clearTimeout(timeout);
        options.signal?.removeEventListener('abort', cancelar);
    }
}
