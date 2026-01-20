'use client'

import { useEffect, useMemo, useState } from 'react'
import { FileCheck2, Loader2, RefreshCw, Pencil, Trash2 } from 'lucide-react'
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
import type { Document, DocumentType, Vehicle } from '@/types/vehicles'

interface DocumentForm {
  id?: string
  vehicleId: string
  tipo: DocumentType
  numero: string
  validade: string
  arquivoUrl: string
  status: string
  notas: string
}

const emptyDocumentForm: DocumentForm = {
  vehicleId: '',
  tipo: 'licenciamento',
  numero: '',
  validade: '',
  arquivoUrl: '',
  status: 'válido',
  notas: ''
}

export function DocumentsTab() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<DocumentForm>(emptyDocumentForm)
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

  const fetchDocs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('validade', { ascending: true })
      .limit(30)

    if (error) {
      toast({ title: 'Erro ao carregar documentos', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    const mapped = (data || []).map((row) => ({
      id: row.id,
      vehicleId: row.vehicle_id,
      driverId: row.driver_id,
      tipo: row.tipo as DocumentType,
      numero: row.numero,
      validade: row.validade,
      arquivoUrl: row.arquivo_url,
      status: row.status,
      notas: row.notas,
      createdAt: row.created_at
    })) as Document[]

    setDocs(mapped)
    setLoading(false)
  }

  useEffect(() => {
    fetchVehicles()
    fetchDocs()
  }, [])

  const handleSave = async () => {
    if (!form.vehicleId || !form.tipo) {
      toast({ title: 'Informe veículo e tipo' })
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
      tipo: form.tipo,
      numero: form.numero || null,
      validade: form.validade || null,
      arquivo_url: form.arquivoUrl || null,
      status: form.status || null,
      notas: form.notas || null
    } as TablesInsert<'documents'>

    const isEdit = Boolean(form.id)
    const { data, error } = isEdit
      ? await supabase
          .from('documents')
          .update(payload)
          .eq('id', form.id!)
          .select('*')
          .single()
      : await supabase
          .from('documents')
          .insert(payload)
          .select('*')
          .single()

    if (error) {
      toast({ title: 'Erro ao salvar documento', description: error.message, variant: 'destructive' })
      setSaving(false)
      return
    }

    const mapped: Document = {
      id: data.id,
      vehicleId: data.vehicle_id,
      driverId: data.driver_id,
      tipo: data.tipo,
      numero: data.numero,
      validade: data.validade,
      arquivoUrl: data.arquivo_url,
      status: data.status,
      notas: data.notas,
      createdAt: data.created_at
    }

    if (isEdit) {
      setDocs((prev) => prev.map(d => d.id === mapped.id ? mapped : d))
      toast({ title: 'Documento atualizado' })
    } else {
      setDocs((prev) => [mapped, ...prev])
      toast({ title: 'Documento salvo' })
    }
    
    setForm(emptyDocumentForm)
    setSaving(false)
  }

  const handleEdit = (doc: Document) => {
    setForm({
      id: doc.id,
      vehicleId: doc.vehicleId || '',
      tipo: doc.tipo,
      numero: doc.numero || '',
      validade: doc.validade || '',
      arquivoUrl: doc.arquivoUrl || '',
      status: doc.status || 'válido',
      notas: doc.notas || ''
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este documento?')) return

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
      return
    }

    setDocs((prev) => prev.filter(d => d.id !== id))
    toast({ title: 'Documento excluído' })
  }

  const vehicleLabel = (vehicleId?: string | null) => {
    if (!vehicleId) return 'Sem veículo vinculado'
    const v = vehicles.find((item) => item.id === vehicleId)
    if (!v) return '—'
    return `${v.placa} · ${v.modelo}`
  }

  const expiryAlerts = useMemo(() => {
    const today = new Date()
    return docs.map((doc) => {
      if (!doc.validade) return { doc, status: 'indefinido' as const }
      const diff = (new Date(doc.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      if (diff < 0) return { doc, status: 'vencido' as const }
      if (diff <= 30) return { doc, status: 'vence_30' as const }
      if (diff <= 60) return { doc, status: 'vence_60' as const }
      return { doc, status: 'ok' as const }
    })
  }, [docs])

  const badgeByExpiry = (status: 'indefinido' | 'vencido' | 'vence_30' | 'vence_60' | 'ok') => {
    switch (status) {
      case 'vencido':
        return 'border border-red-200 bg-red-50 text-red-800'
      case 'vence_30':
        return 'border border-amber-200 bg-amber-50 text-amber-800'
      case 'vence_60':
        return 'border border-yellow-200 bg-yellow-50 text-yellow-800'
      case 'ok':
        return 'border border-emerald-200 bg-emerald-50 text-emerald-800'
      default:
        return 'border border-slate-200 bg-slate-50 text-slate-700'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Documentos e anexos</h2>
          <p className="text-sm text-muted-foreground">Apolices, licenciamento, CNH, comprovantes e laudos com alertas de validade.</p>
        </div>
        <Button variant="outline" onClick={fetchDocs} disabled={loading} className="gap-2 w-full sm:w-auto">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5" /> Registrar documento
          </CardTitle>
          <CardDescription>Controle validade de CNH, seguro, licenciamento e demais anexos.</CardDescription>
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
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={(value) => setForm((f) => ({ ...f, tipo: value as DocumentType }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="apolice">Apólice / seguro</SelectItem>
                <SelectItem value="licenciamento">Licenciamento</SelectItem>
                <SelectItem value="vistoria">Vistoria / laudo</SelectItem>
                <SelectItem value="cnh">CNH condutor</SelectItem>
                <SelectItem value="multa">Multa / recurso</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Número / referência</Label>
            <Input value={form.numero} onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))} placeholder="Número da apólice, CNH..." />
          </div>
          <div className="space-y-2">
            <Label>Validade</Label>
            <Input type="date" value={form.validade} onChange={(e) => setForm((f) => ({ ...f, validade: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>URL / arquivo</Label>
            <Input value={form.arquivoUrl} onChange={(e) => setForm((f) => ({ ...f, arquivoUrl: e.target.value }))} placeholder="Link do PDF no storage" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Input value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} placeholder="válido, vencido, em renovação..." />
          </div>
          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label>Notas</Label>
            <Textarea value={form.notas} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} placeholder="Comprovantes de multa/pagamento, anexos extras" />
          </div>
          <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setForm(emptyDocumentForm)} className="w-full sm:w-auto">{form.id ? 'Cancelar' : 'Limpar'}</Button>
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
            <CardTitle className="text-base">Validades e alertas</CardTitle>
            <CardDescription>Ordenado pela data de validade.</CardDescription>
          </div>
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : expiryAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum documento.</p>
          ) : (
            expiryAlerts.map(({ doc, status }) => (
              <div key={doc.id} className="rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{doc.tipo}</p>
                        <p className="text-xs text-muted-foreground">{vehicleLabel(doc.vehicleId)}</p>
                      </div>
                      <Badge variant="outline" className={badgeByExpiry(status)}>
                        {status === 'vencido' && 'Vencido'}
                        {status === 'vence_30' && 'Vence em ≤30d'}
                        {status === 'vence_60' && 'Vence em ≤60d'}
                        {status === 'ok' && 'Em dia'}
                        {status === 'indefinido' && 'Sem validade'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-3 flex-wrap">
                      <span>Validade: {doc.validade || '—'}</span>
                      <span>Ref: {doc.numero || '—'}</span>
                      <span>Status: {doc.status || '—'}</span>
                      {doc.arquivoUrl && (
                        <a className="text-blue-600" href={doc.arquivoUrl} target="_blank" rel="noreferrer">Ver arquivo</a>
                      )}
                    </div>
                    {doc.notas && <p className="mt-2 text-xs text-muted-foreground">{doc.notas}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(doc)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(doc.id)}
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
