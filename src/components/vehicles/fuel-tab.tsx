'use client'

import { useEffect, useMemo, useState } from 'react'
import { Fuel, Loader2, Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import type { Tables, TablesInsert } from '@/lib/database.types'
import type { FuelLog, Vehicle } from '@/types/vehicles'

interface FuelFormState {
  id?: string
  vehicleId: string
  odometro: string
  litros: string
  valorTotal: string
  posto: string
  bandeira: string
  tipoCombustivel: string
  metodoPagamento: string
  data: string
  notas: string
}

const emptyFuelForm = (): FuelFormState => ({
  vehicleId: '',
  odometro: '',
  litros: '',
  valorTotal: '',
  posto: '',
  bandeira: '',
  tipoCombustivel: '',
  metodoPagamento: '',
  data: new Date().toISOString().slice(0, 16),
  notas: ''
})

export function FuelTab() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [logs, setLogs] = useState<FuelLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FuelFormState>(emptyFuelForm())
  const { toast } = useToast()

  const fetchVehicles = async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, placa, modelo, status')
      .order('placa')

    if (error) {
      toast({ title: 'Erro ao carregar veículos', description: error.message, variant: 'destructive' })
      return
    }
    setVehicles(data as Vehicle[])
  }

  const fetchLogs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('fuel_logs')
      .select('*')
      .order('data', { ascending: false })
      .limit(20)

    if (error) {
      toast({ title: 'Erro ao carregar abastecimentos', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    const mapped = (data || []).map((row) => ({
      id: row.id,
      vehicleId: row.vehicle_id,
      driverId: row.driver_id,
      odometro: Number(row.odometro),
      litros: Number(row.litros),
      valorTotal: Number(row.valor_total),
      precoLitro: row.preco_litro ? Number(row.preco_litro) : null,
      posto: row.posto,
      bandeira: (row as any).bandeira || null,
      tipoCombustivel: (row as any).tipo_combustivel || null,
      metodoPagamento: row.metodo_pagamento,
      data: row.data,
      notas: row.notas
    })) as FuelLog[]

    setLogs(mapped)
    setLoading(false)
  }

  useEffect(() => {
    fetchVehicles()
    fetchLogs()
  }, [])

  const handleSave = async () => {
    if (!form.vehicleId || !form.litros || !form.valorTotal) {
      toast({ title: 'Preencha veículo, litros e valor' })
      return
    }

    setSaving(true)
    
    // Obter user_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({ title: 'Usuário não autenticado', variant: 'destructive' })
      setSaving(false)
      return
    }
    
    const litros = Number(form.litros)
    const valorTotal = Number(form.valorTotal)
    const payload = {
      user_id: user.id,
      vehicle_id: form.vehicleId,
      odometro: form.odometro ? Number(form.odometro) : null,
      litros,
      valor_total: valorTotal,
      preco_litro: litros > 0 ? valorTotal / litros : null,
      posto: form.posto || null,
      bandeira: form.bandeira || null,
      tipo_combustivel: form.tipoCombustivel || null,
      metodo_pagamento: form.metodoPagamento || null,
      data: form.data ? new Date(form.data).toISOString() : new Date().toISOString(),
      notas: form.notas || null
    } as TablesInsert<'fuel_logs'>

    const isEdit = Boolean(form.id)
    const { data, error } = isEdit
      ? await supabase
          .from('fuel_logs')
          .update(payload)
          .eq('id', form.id!)
          .select('*')
          .single()
      : await supabase
          .from('fuel_logs')
          .insert(payload)
          .select('*')
          .single()

    if (error) {
      toast({ title: 'Erro ao salvar abastecimento', description: error.message, variant: 'destructive' })
      setSaving(false)
      return
    }

    // Atualiza odômetro via tabela de leituras apenas se fornecido
    if (form.odometro && Number(form.odometro) > 0) {
      await supabase.from('odometer_readings').insert({
        vehicle_id: payload.vehicle_id,
        valor: Number(form.odometro),
        fonte: 'abastecimento'
      })
    }

    const mapped: FuelLog = {
      id: data.id,
      vehicleId: data.vehicle_id,
      driverId: data.driver_id,
      odometro: Number(data.odometro),
      litros: Number(data.litros),
      valorTotal: Number(data.valor_total),
      precoLitro: data.preco_litro ? Number(data.preco_litro) : null,
      posto: data.posto,
      metodoPagamento: data.metodo_pagamento,
      data: data.data,
      notas: data.notas
    }

    if (isEdit) {
      setLogs((prev) => prev.map(l => l.id === mapped.id ? mapped : l))
      toast({ title: 'Abastecimento atualizado' })
    } else {
      setLogs((prev) => [mapped, ...prev])
      toast({ title: 'Abastecimento registrado' })
    }
    
    setForm(emptyFuelForm())
    setSaving(false)
  }

  const handleEdit = (log: FuelLog) => {
    setForm({
      id: log.id,
      vehicleId: log.vehicleId,
      odometro: log.odometro?.toString() || '',
      litros: log.litros.toString(),
      valorTotal: log.valorTotal.toString(),
      posto: log.posto || '',
      bandeira: log.bandeira || '',
      tipoCombustivel: log.tipoCombustivel || '',
      metodoPagamento: log.metodoPagamento || '',
      data: new Date(log.data).toISOString().slice(0, 16),
      notas: log.notas || ''
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este abastecimento?')) return

    const { error } = await supabase
      .from('fuel_logs')
      .delete()
      .eq('id', id)

    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
      return
    }

    setLogs((prev) => prev.filter(l => l.id !== id))
    toast({ title: 'Abastecimento excluído' })
  }

  const vehicleLabel = (vehicleId: string) => {
    const v = vehicles.find((item) => item.id === vehicleId)
    if (!v) return '—'
    return `${v.placa} · ${v.modelo}`
  }

  const logsWithDerived = useMemo(() => {
    const sorted = [...logs].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    return sorted.map((log, idx) => {
      const previous = sorted.slice(idx + 1).find((item) => item.vehicleId === log.vehicleId)
      const deltaKm = previous ? log.odometro - previous.odometro : null
      const kmPorLitro = deltaKm && deltaKm > 0 ? deltaKm / log.litros : null
      const custoPorKm = deltaKm && deltaKm > 0 ? log.valorTotal / deltaKm : null
      return { log, deltaKm, kmPorLitro, custoPorKm }
    })
  }, [logs])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Abastecimentos e custos</h2>
          <p className="text-sm text-muted-foreground">Lance abastecimentos, calcule consumo e custo por km.</p>
        </div>
        <Button variant="outline" onClick={fetchLogs} disabled={loading} className="gap-2 w-full sm:w-auto">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" /> Registrar abastecimento
          </CardTitle>
          <CardDescription>Use a quilometragem real para manter o consumo correto.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Veículo</Label>
            <Select value={form.vehicleId} onValueChange={(value) => setForm((f) => ({ ...f, vehicleId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.placa} · {v.modelo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Odômetro (km) <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input
              type="number"
              value={form.odometro}
              onChange={(e) => setForm((f) => ({ ...f, odometro: e.target.value }))}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label>Litros</Label>
            <Input
              type="number"
              value={form.litros}
              onChange={(e) => setForm((f) => ({ ...f, litros: e.target.value }))}
              placeholder="50"
            />
          </div>
          <div className="space-y-2">
            <Label>Valor total (R$)</Label>
            <Input
              type="number"
              value={form.valorTotal}
              onChange={(e) => setForm((f) => ({ ...f, valorTotal: e.target.value }))}
              placeholder="300"
            />
          </div>
          <div className="space-y-2">
            <Label>Bandeira</Label>
            <Select value={form.bandeira} onValueChange={(value) => setForm((f) => ({ ...f, bandeira: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shell">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-red-600" />
                    <span>Shell</span>
                  </div>
                </SelectItem>
                <SelectItem value="petrobras">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-600" />
                    <span>Petrobras</span>
                  </div>
                </SelectItem>
                <SelectItem value="ipiranga">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-600" />
                    <span>Ipiranga</span>
                  </div>
                </SelectItem>
                <SelectItem value="raizen">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-600" />
                    <span>Raízen</span>
                  </div>
                </SelectItem>
                <SelectItem value="ale">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500" />
                    <span>Ale</span>
                  </div>
                </SelectItem>
                <SelectItem value="bp">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                    <span>BP</span>
                  </div>
                </SelectItem>
                <SelectItem value="outro">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-400" />
                    <span>Outro</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo de combustível</Label>
            <Select value={form.tipoCombustivel} onValueChange={(value) => setForm((f) => ({ ...f, tipoCombustivel: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gasolina">Gasolina</SelectItem>
                <SelectItem value="etanol">Etanol</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="diesel_s10">Diesel S10</SelectItem>
                <SelectItem value="gnv">GNV</SelectItem>
                <SelectItem value="gasolina_aditivada">Gasolina Aditivada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Posto</Label>
            <Input value={form.posto} onChange={(e) => setForm((f) => ({ ...f, posto: e.target.value }))} placeholder="Rede, cidade..." />
          </div>
          <div className="space-y-2">
            <Label>Método de pagamento</Label>
            <Input value={form.metodoPagamento} onChange={(e) => setForm((f) => ({ ...f, metodoPagamento: e.target.value }))} placeholder="Cartão frota, crédito..." />
          </div>
          <div className="space-y-2">
            <Label>Data</Label>
            <Input
              type="datetime-local"
              value={form.data}
              onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
            />
          </div>
          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label>Notas</Label>
            <Textarea value={form.notas} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} placeholder="Observações, comprovante, autorização..." />
          </div>
          <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setForm(emptyFuelForm())} className="w-full sm:w-auto">{form.id ? 'Cancelar' : 'Limpar'}</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2 w-full sm:w-auto">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {form.id ? 'Atualizar' : 'Registrar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="py-10 text-center text-muted-foreground">Carregando abastecimentos...</CardContent>
          </Card>
        ) : logsWithDerived.length === 0 ? (
          <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="py-10 text-center text-muted-foreground">Nenhum abastecimento lançado</CardContent>
          </Card>
        ) : (
          logsWithDerived.map(({ log, deltaKm, kmPorLitro, custoPorKm }) => (
            <Card key={log.id} className="!rounded-lg sm:!rounded-xl dark:bg-gray-900 dark:border-gray-800">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{vehicleLabel(log.vehicleId)}</CardTitle>
                  <CardDescription>{new Date(log.data).toLocaleString('pt-BR')}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{log.metodoPagamento || '—'}</Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(log)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(log.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex gap-2"><span className="font-semibold text-foreground">Odômetro:</span> {log.odometro} km</div>
                <div className="flex gap-2"><span className="font-semibold text-foreground">Litros:</span> {log.litros}</div>
                <div className="flex gap-2"><span className="font-semibold text-foreground">Valor:</span> R$ {log.valorTotal.toFixed(2)}</div>
                {deltaKm !== null && deltaKm !== undefined && (
                  <div className="flex gap-3 flex-wrap text-xs text-muted-foreground">
                    <span>Rodados desde último: {deltaKm} km</span>
                    <span>·</span>
                    <span>Consumo: {kmPorLitro ? `${kmPorLitro.toFixed(2)} km/L` : '—'}</span>
                    <span>·</span>
                    <span>Custo por km: {custoPorKm ? `R$ ${custoPorKm.toFixed(2)}` : '—'}</span>
                  </div>
                )}
                {log.notas && <p className="text-xs text-muted-foreground">{log.notas}</p>}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
