export const STATUS_EXECUCAO_ACAO_PDI = [
    'NAO_INICIADA',
    'EM_EXECUCAO',
    'CONCLUIDA',
] as const;

export type StatusExecucaoAcaoPdi = (typeof STATUS_EXECUCAO_ACAO_PDI)[number];

export interface CriarAcaoPdiRequest {
    titulo: string | null;
    objetivo: string | null;
    inicioPlanejado: string | null;
    fimPlanejado: string | null;
    resultadoEsperado: string | null;
}

export interface AcaoPdiResponse {
    id: number;
    acaoVersaoId: number;
    pdiId: number;
    pdiVersaoId: number;
    titulo: string | null;
    objetivo: string | null;
    resultadoEsperado: string | null;
    inicioPlanejado: string | null;
    fimPlanejado: string | null;
    ordem: number;
    statusExecucao: StatusExecucaoAcaoPdi;
}
