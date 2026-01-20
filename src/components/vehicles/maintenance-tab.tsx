'use client'

import { useEffect, useState } from 'react'
import { CalendarClock, CheckCheck, Loader2, RefreshCw, Wrench } from 'lucide-react'
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
import type { MaintenanceEvent, MaintenanceStatus, Vehicle } from '@/types/vehicles'

interface MaintenanceForm {
  vehicleId: string
  titulo: string
  status: MaintenanceStatus
  dataPrevista: string
  odometroPrevisto: string
  custo: string
  notas: string
}

const emptyMaintenanceForm: MaintenanceForm = {
  vehicleId: '',
  titulo: '',
  status: 'pendente',
  dataPrevista: '',
  odometroPrevisto: '',
  custo: '',
  notas: ''
}

interface UpcomingMaintenance {
  vehicle_id: string
  template_id: string
  nome: string
  tipo: 'km' | 'data'
  proxima_km: number | null
  proxima_data: string | null
}

export function MaintenanceTab() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [events, setEvents] = useState<MaintenanceEvent[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingMaintenance[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<MaintenanceForm>(emptyMaintenanceForm)
  const { toast } = useToast()

  const fetchVehicles = async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, placa, modelo, status, odometro_atual')
      .order('placa')

    if (error) {
      toast({ title: 'Erro ao carregar veículos', description: error.message, variant: 'destructive' })
      return
    }
    setVehicles(data as Vehicle[])
  }

  const fetchEvents = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('maintenance_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      toast({ title: 'Erro ao carregar manutenções', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    const mapped = (data || []).map((row) => ({
      id: row.id,
      vehicleId: row.vehicle_id,
      templateId: row.template_id,
      titulo: row.titulo,
      odometroPrevisto: row.odometro_previsto,
      dataPrevista: row.data_prevista,
      odometroRealizado: row.odometro_realizado,
      dataRealizada: row.data_realizada,
      custo: row.custo ? Number(row.custo) : null,
      status: row.status as MaintenanceStatus,
      notas: row.notas,
      createdAt: row.created_at
    })) as MaintenanceEvent[]

    setEvents(mapped)
    setLoading(false)
  }

  const fetchUpcoming = async () => {
    const { data, error } = await supabase
      .from('v_vehicle_proximas_manutencoes')
      .select('*')
      .limit(30)

    if (error) {
      toast({ title: 'Erro ao carregar próximas manutenções', description: error.message, variant: 'destructive' })
      return
    }
    setUpcoming((data || []) as UpcomingMaintenance[])
  }

  useEffect(() => {
    fetchVehicles()
    fetchEvents()
    fetchUpcoming()
  }, [])

  const handleSave = async () => {
    if (!form.vehicleId || !form.titulo) {
      toast({ title: 'Informe veículo e título' })
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
    
    const payload: TablesInsert<'maintenance_events'> = {
      user_id: user.id,
      vehicle_id: form.vehicleId,
      titulo: form.titulo,
      status: form.status,
      data_prevista: form.dataPrevista || null,
      odometro_previsto: form.odometroPrevisto ? Number(form.odometroPrevisto) : null,
      custo: form.custo ? Number(form.custo) : null,
      notas: form.notas || null
    }

    const { data, error } = await supabase
      .from('maintenance_events')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      toast({ title: 'Erro ao registrar manutenção', description: error.message, variant: 'destructive' })
      setSaving(false)
      return
    }

    const mapped: MaintenanceEvent = {
      id: data.id,
      vehicleId: data.vehicle_id,
      templateId: data.template_id,
      titulo: data.titulo,
      odometroPrevisto: data.odometro_previsto,
      dataPrevista: data.data_prevista,
      odometroRealizado: data.odometro_realizado,
      dataRealizada: data.data_realizada,
      custo: data.custo ? Number(data.custo) : null,
      status: data.status,
      notas: data.notas,
      createdAt: data.created_at
    }

    setEvents((prev) => [mapped, ...prev])
    setForm(emptyMaintenanceForm)
    toast({ title: 'Manutenção registrada' })
    setSaving(false)
  }

  const statusBadge = (status: MaintenanceStatus) => {
    const base = 'border'
    switch (status) {
      case 'pendente':
        return `${base} border-amber-200 bg-amber-50 text-amber-800`
      case 'agendado':
        return `${base} border-blue-200 bg-blue-50 text-blue-800`
      case 'concluido':
        return `${base} border-emerald-200 bg-emerald-50 text-emerald-800`
      case 'cancelado':
        return `${base} border-slate-200 bg-slate-50 text-slate-700`
      default:
        return base
    }
  }

  const vehicleLabel = (vehicleId: string) => {
    const v = vehicles.find((item) => item.id === vehicleId)
    if (!v) return '—'
    return `${v.placa} · ${v.modelo}`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Manutenção e compliance</h2>
          <p className="text-sm text-muted-foreground">Controle de revisões, checklists, recalls e status.</p>
        </div>
        <Button variant="outline" onClick={() => { fetchEvents(); fetchUpcoming(); }} disabled={loading} className="gap-2 w-full sm:w-auto">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" /> Registrar manutenção
          </CardTitle>
          <CardDescription>Agende revisões por km ou data e registre execução.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Veículo</Label>
            <Select value={form.vehicleId} onValueChange={(value) => setForm((f) => ({ ...f, vehicleId: value }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.placa} · {v.modelo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} placeholder="Revisão 20k, troca pneus..." />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(value) => setForm((f) => ({ ...f, status: value as MaintenanceStatus }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="agendado">Agendado</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data prevista</Label>
            <Input type="date" value={form.dataPrevista} onChange={(e) => setForm((f) => ({ ...f, dataPrevista: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Odômetro previsto</Label>
            <Input type="number" value={form.odometroPrevisto} onChange={(e) => setForm((f) => ({ ...f, odometroPrevisto: e.target.value }))} placeholder="50000" />
          </div>
          <div className="space-y-2">
            <Label>Custo estimado (R$)</Label>
            <Input type="number" value={form.custo} onChange={(e) => setForm((f) => ({ ...f, custo: e.target.value }))} placeholder="0" />
          </div>
          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label>Notas / checklist</Label>
            <Textarea value={form.notas} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} placeholder="Checklist de entrega/devolução, peças, rodízio de pneus, recall..." />
          </div>
          <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setForm(emptyMaintenanceForm)} className="w-full sm:w-auto">Limpar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2 w-full sm:w-auto">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Últimas manutenções</CardTitle>
              <CardDescription>Execuções e agendamentos recentes.</CardDescription>
            </div>
            <CheckCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum registro.</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{event.titulo}</p>
                      <p className="text-xs text-muted-foreground">{vehicleLabel(event.vehicleId)}</p>
                    </div>
                    <Badge className={statusBadge(event.status)} variant="outline">{event.status}</Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>Prevista: {event.dataPrevista || '—'}</span>
                    <span>Odo previsto: {event.odometroPrevisto ?? '—'}</span>
                    <span>Realizado: {event.dataRealizada || '—'}</span>
                    <span>Odo real: {event.odometroRealizado ?? '—'}</span>
                    <span>Custo: {event.custo ? `R$ ${event.custo.toFixed(2)}` : '—'}</span>
                  </div>
                  {event.notas && <p className="mt-2 text-xs text-muted-foreground">{event.notas}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Próximas manutenções (templates)</CardTitle>
              <CardDescription>Calculadas por km ou dias.</CardDescription>
            </div>
            <CalendarClock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Configure templates para ver previsões.</p>
            ) : (
              upcoming.map((item) => (
                <div key={`${item.vehicle_id}-${item.template_id}`} className="rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">{item.nome}</p>
                    <Badge variant="outline">{item.tipo === 'km' ? 'Por km' : 'Por data'}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{vehicleLabel(item.vehicle_id)}</p>
                  <div className="mt-2 text-xs text-muted-foreground flex gap-3 flex-wrap">
                    <span>Próxima km: {item.proxima_km ?? '—'}</span>
                    <span>Próxima data: {item.proxima_data || '—'}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
