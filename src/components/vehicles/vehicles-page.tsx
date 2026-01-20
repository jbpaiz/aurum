'use client'

import { useEffect, useMemo, useState } from 'react'
import { Car, MapPin, Plus, RefreshCw, Wrench, Pencil, Trash2, Tags } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/lib/database.types'
import { useToast } from '@/hooks/use-toast'
import type { Vehicle, VehicleStatus } from '@/types/vehicles'

interface VehicleFormState {
  id?: string
  placa: string
  renavam: string
  modelo: string
  ano: string
  categoria: string
  status: VehicleStatus
  odometro: string
  local: string
  tags: string
}

const emptyForm: VehicleFormState = {
  placa: '',
  renavam: '',
  modelo: '',
  ano: '',
  categoria: '',
  status: 'ativo',
  odometro: '',
  local: '',
  tags: ''
}

const statusColors: Record<VehicleStatus, string> = {
  ativo: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  manutencao: 'bg-amber-100 text-amber-800 border-amber-200',
  inativo: 'bg-slate-100 text-slate-800 border-slate-200',
  vendido: 'bg-sky-100 text-sky-800 border-sky-200'
}

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<VehicleFormState>(emptyForm)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const fetchVehicles = async () => {
    setLoading(true)
    // RLS filtra automaticamente por user_id
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast({ title: 'Erro ao carregar veículos', description: error.message, variant: 'destructive' })
      setVehicles([])
      setLoading(false)
      return
    }

    const mapped = (data || []).map(row => ({
      id: row.id,
      placa: row.placa,
      renavam: row.renavam,
      modelo: row.modelo,
      ano: row.ano,
      categoria: row.categoria,
      status: row.status as VehicleStatus,
      odometroAtual: row.odometro_atual,
      localAtual: row.local_atual,
      tags: row.tags,
      centroCustoId: row.centro_custo_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })) as Vehicle[]

    setVehicles(mapped)
    setLoading(false)
  }

  useEffect(() => {
    fetchVehicles()
  }, [])

  const handleSave = async () => {
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
      placa: form.placa.trim().toUpperCase(),
      renavam: form.renavam.trim() || null,
      modelo: form.modelo.trim(),
      ano: form.ano ? Number(form.ano) : null,
      categoria: form.categoria.trim() || null,
      status: form.status,
      odometro_atual: form.odometro ? Number(form.odometro) : null,
      local_atual: form.local.trim() || null,
      tags: form.tags
        ? form.tags
            .split(',')
            .map(t => t.trim())
            .filter(Boolean)
        : []
    } as TablesInsert<'vehicles'>

    const isEdit = Boolean(form.id)
    if (isEdit && !form.id) {
      toast({ title: 'ID do veículo ausente', variant: 'destructive' })
      setSaving(false)
      return
    }

    const { data, error } = isEdit
      ? await supabase
        .from('vehicles')
        .update(payload)
        .eq('id', form.id as string)
        .select('*')
        .single()
      : await supabase
        .from('vehicles')
        .insert(payload)
        .select('*')
        .single()

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
      setSaving(false)
      return
    }

    toast({ title: isEdit ? 'Veículo atualizado' : 'Veículo criado' })
    setOpen(false)
    setForm(emptyForm)

    if (data) {
      const mapped: Vehicle = {
        id: data.id,
        placa: data.placa,
        renavam: data.renavam,
        modelo: data.modelo,
        ano: data.ano,
        categoria: data.categoria,
        status: data.status as VehicleStatus,
        odometroAtual: data.odometro_atual,
        localAtual: data.local_atual,
        tags: data.tags,
        centroCustoId: data.centro_custo_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }

      setVehicles(prev => {
        if (isEdit) {
          return prev.map(v => (v.id === mapped.id ? mapped : v))
        }
        return [mapped, ...prev]
      })
    }

    setSaving(false)
  }

  const handleEdit = (vehicle: Vehicle) => {
    setForm({
      id: vehicle.id,
      placa: vehicle.placa,
      renavam: vehicle.renavam || '',
      modelo: vehicle.modelo,
      ano: vehicle.ano ? String(vehicle.ano) : '',
      categoria: vehicle.categoria || '',
      status: vehicle.status,
      odometro: vehicle.odometroAtual ? String(vehicle.odometroAtual) : '',
      local: vehicle.localAtual || '',
      tags: vehicle.tags?.join(', ') || ''
    })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm('Excluir este veículo?')
    if (!confirmDelete) return

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)

    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
      return
    }

    setVehicles(prev => prev.filter(v => v.id !== id))
    toast({ title: 'Veículo excluído' })
  }

  const stats = useMemo(() => {
    const total = vehicles.length
    const ativos = vehicles.filter(v => v.status === 'ativo').length
    const manutencao = vehicles.filter(v => v.status === 'manutencao').length
    const vendidos = vehicles.filter(v => v.status === 'vendido').length
    const inativos = vehicles.filter(v => v.status === 'inativo').length
    return { total, ativos, manutencao, vendidos, inativos }
  }, [vehicles])

  const renderTagList = (tags?: string[] | null) => {
    if (!tags || tags.length === 0) return <span className="text-xs text-muted-foreground">Sem tags</span>
    return (
      <div className="flex flex-wrap gap-1">
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="text-[11px]">
            <Tags className="h-3 w-3 mr-1" />
            {tag}
          </Badge>
        ))}
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 sm:p-5 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Veículos</h1>
          <p className="text-gray-600 dark:text-gray-400">Cadastre e acompanhe a frota</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={fetchVehicles} disabled={loading} className="gap-2 w-full sm:w-auto">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Novo veículo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{form.id ? 'Editar veículo' : 'Novo veículo'}</DialogTitle>
                <DialogDescription>Preencha os dados básicos do veículo.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                <div className="space-y-2">
                  <Label>Placa</Label>
                  <Input
                    value={form.placa}
                    onChange={e => setForm(f => ({ ...f, placa: e.target.value }))}
                    placeholder="ABC1D23"
                  />
                </div>
                <div className="space-y-2">
                  <Label>RENAVAM / Identificador</Label>
                  <Input
                    value={form.renavam}
                    onChange={e => setForm(f => ({ ...f, renavam: e.target.value }))}
                    placeholder="Opcional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <Input
                    value={form.modelo}
                    onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))}
                    placeholder="Ex: Onix 1.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Input
                    type="number"
                    value={form.ano}
                    onChange={e => setForm(f => ({ ...f, ano: e.target.value }))}
                    placeholder="2022"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input
                    value={form.categoria}
                    onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                    placeholder="Sedan, SUV, Van..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={value => setForm(f => ({ ...f, status: value as VehicleStatus }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="vendido">Vendido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Odômetro atual (km)</Label>
                  <Input
                    type="number"
                    value={form.odometro}
                    onChange={e => setForm(f => ({ ...f, odometro: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Local atual</Label>
                  <Input
                    value={form.local}
                    onChange={e => setForm(f => ({ ...f, local: e.target.value }))}
                    placeholder="Garagem, Filial..."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Tags (separe com vírgula)</Label>
                  <Input
                    value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="pool, executivo, logística"
                  />
                </div>
              </div>
              <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => { setOpen(false); setForm(emptyForm) }} className="w-full sm:w-auto">Cancelar</Button>
                <Button onClick={handleSave} disabled={saving || !form.placa || !form.modelo} className="w-full sm:w-auto">
                  {saving ? 'Salvando...' : form.id ? 'Salvar alterações' : 'Criar veículo'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards de status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</CardTitle>
            <Car className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            <CardDescription>Veículos cadastrados</CardDescription>
          </CardContent>
        </Card>
        <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Ativos</CardTitle>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">{stats.ativos}</Badge>
          </CardHeader>
          <CardContent>
            <CardDescription>Disponíveis para uso</CardDescription>
          </CardContent>
        </Card>
        <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Manutenção</CardTitle>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">{stats.manutencao}</Badge>
          </CardHeader>
          <CardContent>
            <CardDescription>Em oficina ou agendados</CardDescription>
          </CardContent>
        </Card>
        <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Vendidos/Inativos</CardTitle>
            <Badge className="bg-slate-100 text-slate-800 border-slate-200">{stats.vendidos + stats.inativos}</Badge>
          </CardHeader>
          <CardContent>
            <CardDescription>Fora de circulação</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Lista de veículos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="py-10 text-center text-muted-foreground">Carregando veículos...</CardContent>
          </Card>
        ) : vehicles.length === 0 ? (
          <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="py-10 text-center text-muted-foreground">Nenhum veículo cadastrado</CardContent>
          </Card>
        ) : (
          vehicles.map(vehicle => (
            <Card key={vehicle.id} className="!rounded-lg sm:!rounded-xl dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Car className="h-5 w-5 text-blue-500" />
                    {vehicle.modelo}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="outline" className={statusColors[vehicle.status]}>{vehicle.status}</Badge>
                    <span className="font-semibold">{vehicle.placa}</span>
                    {vehicle.ano && <span className="text-muted-foreground">· {vehicle.ano}</span>}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(vehicle)} aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(vehicle.id)} aria-label="Excluir">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wrench className="h-4 w-4" />
                  <span>Odômetro: {vehicle.odometroAtual ?? '—'} km</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Local: {vehicle.localAtual || '—'}</span>
                </div>
                {renderTagList(vehicle.tags)}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
