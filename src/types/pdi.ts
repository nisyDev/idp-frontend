// Contrato de com.empresa.pdi.dto.PdiRascunhoResponse.
export const STATUS_EXECUCAO_PDI = [
    'NAO_INICIADO',
    'EM_EXECUCAO',
    'CONCLUIDO',
] as const;

export const STATUS_APROVACAO_PDI = [
    'RASCUNHO',
    'AGUARDANDO_APROVACAO',
    'APROVADO',
    'REPROVADO',
    'RETIRADA',
] as const;

export type StatusExecucaoPdi = (typeof STATUS_EXECUCAO_PDI)[number];
export type StatusAprovacaoPdi = (typeof STATUS_APROVACAO_PDI)[number];

export interface CriarPdiRequest {
    titulo: string | null;
    objetivo: string | null;
    inicioPlanejado: string | null;
    fimPlanejado: string | null;
}

export type AtualizarPdiRascunhoRequest = CriarPdiRequest;

export interface PdiRascunhoResponse {
    id: number;
    versaoId: number;
    numeroVersao: number;
    versaoVigenteId?: number | null;
    statusExecucao: StatusExecucaoPdi;
    statusAprovacao: StatusAprovacaoPdi;
    titulo?: string | null;
    objetivo?: string | null;
    inicioPlanejado?: string | null;
    fimPlanejado?: string | null;
    criadoEm: string;
    versaoCriadaEm: string;
}
