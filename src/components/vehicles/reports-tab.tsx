'use client'

import { useEffect, useState, useMemo } from 'react'
import { BarChart3, DollarSign, Fuel, Gavel, Loader2, RefreshCw, TrendingUp, Wrench } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import type { Vehicle } from '@/types/vehicles'

interface CostData {
  vehicleId: string
  abastecimentos: number
  manutencoes: number
  multas: number
  total: number
}

export function ReportsTab() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [costs, setCosts] = useState<CostData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all')
  const { toast } = useToast()

  const fetchVehicles = async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, placa, modelo')
      .order('placa')

    if (error) {
      toast({ title: 'Erro ao carregar veículos', description: error.message, variant: 'destructive' })
      return
    }
    setVehicles(data as Vehicle[])
  }

  const fetchCosts = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Buscar abastecimentos
    const { data: fuelData } = await supabase
      .from('fuel_logs')
      .select('vehicle_id, valor_total')
      .eq('user_id', user.id)

    // Buscar manutenções
    const { data: maintenanceData } = await supabase
      .from('maintenance_events')
      .select('vehicle_id, custo')
      .eq('user_id', user.id)

    // Buscar multas
    const { data: finesData } = await supabase
      .from('fines')
      .select('vehicle_id, valor')
      .eq('user_id', user.id)

    // Agregar custos por veículo
    const costMap = new Map<string, CostData>()

    fuelData?.forEach((item) => {
      if (!costMap.has(item.vehicle_id)) {
        costMap.set(item.vehicle_id, {
          vehicleId: item.vehicle_id,
          abastecimentos: 0,
          manutencoes: 0,
          multas: 0,
          total: 0
        })
      }
      const cost = costMap.get(item.vehicle_id)!
      cost.abastecimentos += Number(item.valor_total)
      cost.total += Number(item.valor_total)
    })

    maintenanceData?.forEach((item) => {
      if (!costMap.has(item.vehicle_id)) {
        costMap.set(item.vehicle_id, {
          vehicleId: item.vehicle_id,
          abastecimentos: 0,
          manutencoes: 0,
          multas: 0,
          total: 0
        })
      }
      const cost = costMap.get(item.vehicle_id)!
      if (item.custo) {
        cost.manutencoes += Number(item.custo)
        cost.total += Number(item.custo)
      }
    })

    finesData?.forEach((item) => {
      if (!costMap.has(item.vehicle_id)) {
        costMap.set(item.vehicle_id, {
          vehicleId: item.vehicle_id,
          abastecimentos: 0,
          manutencoes: 0,
          multas: 0,
          total: 0
        })
      }
      const cost = costMap.get(item.vehicle_id)!
      cost.multas += Number(item.valor)
      cost.total += Number(item.valor)
    })

    setCosts(Array.from(costMap.values()))
    setLoading(false)
  }

  useEffect(() => {
    fetchVehicles()
    fetchCosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const vehicleLabel = (vehicleId: string) => {
    const v = vehicles.find((item) => item.id === vehicleId)
    if (!v) return '—'
    return `${v.placa} · ${v.modelo}`
  }

  const filteredCosts = useMemo(() => {
    if (selectedVehicle === 'all') return costs
    return costs.filter(c => c.vehicleId === selectedVehicle)
  }, [costs, selectedVehicle])

  const totalCosts = useMemo(() => {
    return filteredCosts.reduce((acc, cost) => ({
      abastecimentos: acc.abastecimentos + cost.abastecimentos,
      manutencoes: acc.manutencoes + cost.manutencoes,
      multas: acc.multas + cost.multas,
      total: acc.total + cost.total
    }), { abastecimentos: 0, manutencoes: 0, multas: 0, total: 0 })
  }, [filteredCosts])

  const costsByType = useMemo(() => {
    const total = totalCosts.total
    if (total === 0) return []

    return [
      {
        tipo: 'Abastecimentos',
        valor: totalCosts.abastecimentos,
        percentual: (totalCosts.abastecimentos / total) * 100,
        icon: Fuel,
        color: 'text-blue-600'
      },
      {
        tipo: 'Manutenções',
        valor: totalCosts.manutencoes,
        percentual: (totalCosts.manutencoes / total) * 100,
        icon: Wrench,
        color: 'text-amber-600'
      },
      {
        tipo: 'Multas',
        valor: totalCosts.multas,
        percentual: (totalCosts.multas / total) * 100,
        icon: Gavel,
        color: 'text-red-600'
      }
    ].sort((a, b) => b.valor - a.valor)
  }, [totalCosts])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Relatório de custos</h2>
          <p className="text-sm text-muted-foreground">Análise de gastos por veículo e tipo de despesa.</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Todos os veículos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os veículos</SelectItem>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.placa} · {v.modelo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchCosts} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalCosts.total.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {selectedVehicle === 'all' ? `${vehicles.length} veículos` : '1 veículo'}
            </p>
          </CardContent>
        </Card>

        <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abastecimentos</CardTitle>
            <Fuel className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalCosts.abastecimentos.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {totalCosts.total > 0 ? `${((totalCosts.abastecimentos / totalCosts.total) * 100).toFixed(1)}% do total` : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manutenções</CardTitle>
            <Wrench className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalCosts.manutencoes.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {totalCosts.total > 0 ? `${((totalCosts.manutencoes / totalCosts.total) * 100).toFixed(1)}% do total` : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Multas</CardTitle>
            <Gavel className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalCosts.multas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {totalCosts.total > 0 ? `${((totalCosts.multas / totalCosts.total) * 100).toFixed(1)}% do total` : '0%'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico por tipo de gasto */}
      <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Distribuição de custos por tipo
          </CardTitle>
          <CardDescription>Proporção de cada categoria de gasto no total.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : costsByType.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum custo registrado.</p>
          ) : (
            costsByType.map((item) => (
              <div key={item.tipo} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                    <span className="font-medium">{item.tipo}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    R$ {item.valor.toFixed(2)} ({item.percentual.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      item.tipo === 'Abastecimentos' ? 'bg-blue-600' :
                      item.tipo === 'Manutenções' ? 'bg-amber-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${item.percentual}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Tabela por veículo */}
      <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Custos detalhados por veículo
          </CardTitle>
          <CardDescription>Valores separados por categoria para cada veículo.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCosts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum custo registrado.</p>
          ) : (
            <div className="space-y-3">
              {filteredCosts
                .sort((a, b) => b.total - a.total)
                .map((cost) => (
                  <div key={cost.vehicleId} className="rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-foreground">{vehicleLabel(cost.vehicleId)}</h3>
                      <span className="text-lg font-bold">R$ {cost.total.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Fuel className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-muted-foreground">Abastecimentos</p>
                          <p className="font-semibold">R$ {cost.abastecimentos.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Wrench className="h-4 w-4 text-amber-600" />
                        <div>
                          <p className="text-muted-foreground">Manutenções</p>
                          <p className="font-semibold">R$ {cost.manutencoes.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Gavel className="h-4 w-4 text-red-600" />
                        <div>
                          <p className="text-muted-foreground">Multas</p>
                          <p className="font-semibold">R$ {cost.multas.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
