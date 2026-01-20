'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Gavel, Loader2, RefreshCw, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import type { TablesInsert } from '@/lib/database.types'
import type { Fine, FineStatus, Vehicle } from '@/types/vehicles'

interface FineForm {
  id?: string
  vehicleId: string
  data: string
  valor: string
  status: FineStatus
  orgao: string
  autoInfracao: string
  vencimento: string
  comprovanteUrl: string
  notas: string
}

const emptyFineForm: FineForm = {
  vehicleId: '',
  data: '',
  valor: '',
  status: 'recebida',
  orgao: '',
  autoInfracao: '',
  vencimento: '',
  comprovanteUrl: '',
  notas: ''
}

export function FinesTab() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [fines, setFines] = useState<Fine[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FineForm>(emptyFineForm)
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

  const fetchFines = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('fines')
      .select('*')
      .order('data', { ascending: false })
      .limit(30)

    if (error) {
      toast({ title: 'Erro ao carregar multas', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    const mapped = (data || []).map((row) => ({
      id: row.id,
      vehicleId: row.vehicle_id,
      driverId: row.driver_id,
      autoInfracao: row.auto_infracao,
      orgao: row.orgao,
      data: row.data,
      valor: Number(row.valor),
      pontos: row.pontos,
      status: row.status,
      vencimento: row.vencimento,
      comprovanteUrl: row.comprovante_url,
      createdAt: row.created_at
    })) as Fine[]

    setFines(mapped)
    setLoading(false)
  }

  useEffect(() => {
    fetchVehicles()
    fetchFines()
  }, [])

  const handleSave = async () => {
    if (!form.vehicleId || !form.valor || !form.data) {
      toast({ title: 'Informe veículo, data e valor' })
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
    
    const payload = {
      user_id: user.id,
      vehicle_id: form.vehicleId,
      data: form.data,
      valor: Number(form.valor),
      status: form.status,
      orgao: form.orgao || null,
      auto_infracao: form.autoInfracao || null,
      vencimento: form.vencimento || null,
      comprovante_url: form.comprovanteUrl || null
    } as TablesInsert<'fines'>

    const isEdit = Boolean(form.id)
    const { data, error } = isEdit
      ? await supabase
          .from('fines')
          .update(payload)
          .eq('id', form.id!)
          .select('*')
          .single()
      : await supabase
          .from('fines')
          .insert(payload)
          .select('*')
          .single()

    if (error) {
      toast({ title: 'Erro ao salvar multa', description: error.message, variant: 'destructive' })
      setSaving(false)
      return
    }

    const mapped: Fine = {
      id: data.id,
      vehicleId: data.vehicle_id,
      driverId: data.driver_id,
      autoInfracao: data.auto_infracao,
      orgao: data.orgao,
      data: data.data,
      valor: Number(data.valor),
      pontos: data.pontos,
      status: data.status,
      vencimento: data.vencimento,
      comprovanteUrl: data.comprovante_url,
      createdAt: data.created_at
    }

    if (isEdit) {
      setFines((prev) => prev.map(f => f.id === mapped.id ? mapped : f))
      toast({ title: 'Multa atualizada' })
    } else {
      setFines((prev) => [mapped, ...prev])
      toast({ title: 'Multa cadastrada' })
    }
    
    setForm(emptyFineForm)
    setSaving(false)
  }

  const handleEdit = (fine: Fine) => {
    setForm({
      id: fine.id,
      vehicleId: fine.vehicleId,
      data: fine.data,
      valor: fine.valor.toString(),
      status: fine.status,
      orgao: fine.orgao || '',
      autoInfracao: fine.autoInfracao || '',
      vencimento: fine.vencimento || '',
      comprovanteUrl: fine.comprovanteUrl || '',
      notas: fine.notas || ''
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta multa?')) return

    const { error } = await supabase
      .from('fines')
      .delete()
      .eq('id', id)

    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
      return
    }

    setFines((prev) => prev.filter(f => f.id !== id))
    toast({ title: 'Multa excluída' })
  }

  const statusBadge = (status: FineStatus | string) => {
    switch (status) {
      case 'recebida':
        return 'border border-amber-200 bg-amber-50 text-amber-800'
      case 'em_recurso':
        return 'border border-blue-200 bg-blue-50 text-blue-800'
      case 'paga':
        return 'border border-emerald-200 bg-emerald-50 text-emerald-800'
      default:
        return 'border border-slate-200 bg-slate-50 text-slate-700'
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
          <h2 className="text-xl font-semibold">Multas e infrações</h2>
          <p className="text-sm text-muted-foreground">Lançamento manual ou ingestão via CSV/API, status de recurso/pagamento.</p>
        </div>
        <Button variant="outline" onClick={fetchFines} disabled={loading} className="gap-2 w-full sm:w-auto">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" /> {form.id ? 'Editar multa' : 'Registrar multa'}
          </CardTitle>
          <CardDescription>Controle recurso, pagamento e vínculo ao veículo/condutor.</CardDescription>
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
            <Label>Data</Label>
            <Input type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input type="number" value={form.valor} onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(value) => setForm((f) => ({ ...f, status: value as FineStatus }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recebida">Recebida</SelectItem>
                <SelectItem value="em_recurso">Em recurso</SelectItem>
                <SelectItem value="paga">Paga</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Órgão</Label>
            <Input value={form.orgao} onChange={(e) => setForm((f) => ({ ...f, orgao: e.target.value }))} placeholder="DETRAN, DER..." />
          </div>
          <div className="space-y-2">
            <Label>Auto de infração</Label>
            <Input value={form.autoInfracao} onChange={(e) => setForm((f) => ({ ...f, autoInfracao: e.target.value }))} placeholder="Número ou referência" />
          </div>
          <div className="space-y-2">
            <Label>Vencimento</Label>
            <Input type="date" value={form.vencimento} onChange={(e) => setForm((f) => ({ ...f, vencimento: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Comprovante (URL)</Label>
            <Input value={form.comprovanteUrl} onChange={(e) => setForm((f) => ({ ...f, comprovanteUrl: e.target.value }))} placeholder="Link para PDF/imagem" />
          </div>
          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label>Notas</Label>
            <Textarea value={form.notas} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} placeholder="Status do recurso, protocolos" />
          </div>
          <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setForm(emptyFineForm)} className="w-full sm:w-auto">{form.id ? 'Cancelar' : 'Limpar'}</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2 w-full sm:w-auto">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {form.id ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Multas recentes</CardTitle>
            <CardDescription>Status e vencimento.</CardDescription>
          </div>
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : fines.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma multa.</p>
          ) : (
            fines.map((fine) => (
              <div key={fine.id} className="rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{fine.autoInfracao || 'Auto não informado'}</p>
                        <p className="text-xs text-muted-foreground">{vehicleLabel(fine.vehicleId)}</p>
                      </div>
                      <Badge variant="outline" className={statusBadge(fine.status)}>{fine.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-3 flex-wrap">
                      <span>Data: {fine.data}</span>
                      <span>Venc.: {fine.vencimento || '—'}</span>
                      <span>Valor: R$ {fine.valor.toFixed(2)}</span>
                      {fine.comprovanteUrl && (
                        <a href={fine.comprovanteUrl} className="text-blue-600" target="_blank" rel="noreferrer">Comprovante</a>
                      )}
                    </div>
                    {fine.orgao && <p className="text-xs text-muted-foreground mt-1">Órgão: {fine.orgao}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(fine)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(fine.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
