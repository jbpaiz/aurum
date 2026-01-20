export type VehicleStatus = 'ativo' | 'manutencao' | 'inativo' | 'vendido'

export type MaintenanceStatus = 'pendente' | 'agendado' | 'concluido' | 'cancelado'
export type CostCategory = 'combustivel' | 'manutencao' | 'seguro' | 'licenciamento' | 'multa' | 'outros'
export type DocumentType = 'apolice' | 'licenciamento' | 'vistoria' | 'cnh' | 'multa' | 'outro'
export type FineStatus = 'recebida' | 'em_recurso' | 'paga'

export interface Vehicle {
  id: string
  placa: string
  renavam?: string | null
  modelo: string
  ano?: number | null
  tipo?: 'carro' | 'moto'
  categoria?: string | null
  status: VehicleStatus
  odometroAtual?: number | null
  localAtual?: string | null
  tags?: string[] | null
  centroCustoId?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface Driver {
  id: string
  nome: string
  cnhNumero?: string | null
  cnhCategoria?: string | null
  cnhValidade?: string | null
  ativo: boolean
  userId?: string | null
  createdAt?: string | null
}

export interface MaintenanceTemplate {
  id: string
  nome: string
  tipo: 'km' | 'data'
  intervaloKm?: number | null
  intervaloDias?: number | null
  descricao?: string | null
  ativo: boolean
  createdAt?: string | null
}

export interface MaintenanceEvent {
  id: string
  vehicleId: string
  templateId?: string | null
  titulo: string
  odometroPrevisto?: number | null
  dataPrevista?: string | null
  odometroRealizado?: number | null
  dataRealizada?: string | null
  custo?: number | null
  status: MaintenanceStatus
  notas?: string | null
  createdAt?: string | null
}

export interface FuelLog {
  id: string
  vehicleId: string
  driverId?: string | null
  odometro: number
  litros: number
  valorTotal: number
  precoLitro?: number | null
  posto?: string | null
  metodoPagamento?: string | null
  data: string
  notas?: string | null
}

export interface CostItem {
  id: string
  vehicleId: string
  categoria: CostCategory
  valor: number
  data: string
  referenciaId?: string | null
  referenciaTabela?: string | null
  notas?: string | null
}

export interface Document {
  id: string
  vehicleId?: string | null
  driverId?: string | null
  tipo: DocumentType
  numero?: string | null
  validade?: string | null
  arquivoUrl?: string | null
  status?: string | null
  notas?: string | null
  createdAt?: string | null
}

export interface Attachment {
  id: string
  parentType: string
  parentId: string
  url: string
  mime?: string | null
  legenda?: string | null
  createdAt?: string | null
}

export interface Fine {
  id: string
  vehicleId: string
  driverId?: string | null
  autoInfracao?: string | null
  orgao?: string | null
  data: string
  valor: number
  pontos?: number | null
  status: string
  vencimento?: string | null
  comprovanteUrl?: string | null
  notas?: string | null
  createdAt?: string | null
}
