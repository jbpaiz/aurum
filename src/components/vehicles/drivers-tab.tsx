'use client'

import { useEffect, useState } from 'react'
import { Contact, Loader2, RefreshCw, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import type { TablesInsert } from '@/lib/database.types'
import type { Driver } from '@/types/vehicles'

interface DriverForm {
  id?: string
  nome: string
  cnhNumero: string
  cnhCategoria: string
  cnhValidade: string
  ativo: 'true' | 'false'
}

const emptyDriverForm: DriverForm = {
  nome: '',
  cnhNumero: '',
  cnhCategoria: '',
  cnhValidade: '',
  ativo: 'true'
}

export function DriversTab() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<DriverForm>(emptyDriverForm)
  const { toast } = useToast()

  const fetchDrivers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      toast({ title: 'Erro ao carregar condutores', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    const mapped = (data || []).map((row) => ({
      id: row.id,
      nome: row.nome,
      cnhNumero: row.cnh_numero,
      cnhCategoria: row.cnh_categoria,
      cnhValidade: row.cnh_validade,
      ativo: row.ativo,
      userId: row.user_id,
      createdAt: row.created_at
    })) as Driver[]

    setDrivers(mapped)
    setLoading(false)
  }

  useEffect(() => {
    fetchDrivers()
  }, [])

  const handleSave = async () => {
    if (!form.nome) {
      toast({ title: 'Informe o nome do condutor' })
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
      nome: form.nome,
      cnh_numero: form.cnhNumero || null,
      cnh_categoria: form.cnhCategoria || null,
      cnh_validade: form.cnhValidade || null,
      ativo: form.ativo === 'true'
    }

    const isEdit = Boolean(form.id)
    const { data, error } = isEdit
      ? await supabase
          .from('drivers')
          .update(payload)
          .eq('id', form.id!)
          .select('*')
          .single()
      : await supabase
          .from('drivers')
          .insert(payload)
          .select('*')
          .single()

    if (error) {
      toast({ title: 'Erro ao salvar condutor', description: error.message, variant: 'destructive' })
      setSaving(false)
      return
    }

    const mapped: Driver = {
      id: data.id,
      nome: data.nome,
      cnhNumero: data.cnh_numero,
      cnhCategoria: data.cnh_categoria,
      cnhValidade: data.cnh_validade,
      ativo: data.ativo,
      userId: data.user_id,
      createdAt: data.created_at
    }

    if (isEdit) {
      setDrivers((prev) => prev.map(d => d.id === mapped.id ? mapped : d))
      toast({ title: 'Condutor atualizado' })
    } else {
      setDrivers((prev) => [mapped, ...prev])
      toast({ title: 'Condutor cadastrado' })
    }
    
    setForm(emptyDriverForm)
    setSaving(false)
  }

  const handleEdit = (driver: Driver) => {
    setForm({
      id: driver.id,
      nome: driver.nome,
      cnhNumero: driver.cnhNumero || '',
      cnhCategoria: driver.cnhCategoria || '',
      cnhValidade: driver.cnhValidade || '',
      ativo: driver.ativo ? 'true' : 'false'
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este condutor?')) return

    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id)

    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
      return
    }

    setDrivers((prev) => prev.filter(d => d.id !== id))
    toast({ title: 'Condutor excluído' })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Condutores</h2>
          <p className="text-sm text-muted-foreground">Cadastre CNH e vincule depois aos lançamentos.</p>
        </div>
        <Button variant="outline" onClick={fetchDrivers} disabled={loading} className="gap-2 w-full sm:w-auto">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card className="!rounded-lg sm:!rounded-xl dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Contact className="h-5 w-5" /> {form.id ? 'Editar condutor' : 'Registrar condutor'}
          </CardTitle>
          <CardDescription>Guarde CNH para compliance e vínculo com multas/abastecimentos.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
          </div>
          <div className="space-y-2">
            <Label>CNH</Label>
            <Input value={form.cnhNumero} onChange={(e) => setForm((f) => ({ ...f, cnhNumero: e.target.value }))} placeholder="Número da CNH" />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Input value={form.cnhCategoria} onChange={(e) => setForm((f) => ({ ...f, cnhCategoria: e.target.value }))} placeholder="B, C, D..." />
          </div>
          <div className="space-y-2">
            <Label>Validade CNH</Label>
            <Input type="date" value={form.cnhValidade} onChange={(e) => setForm((f) => ({ ...f, cnhValidade: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.ativo} onValueChange={(value) => setForm((f) => ({ ...f, ativo: value as 'true' | 'false' }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Ativo</SelectItem>
                <SelectItem value="false">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setForm(emptyDriverForm)} className="w-full sm:w-auto">{form.id ? 'Cancelar' : 'Limpar'}</Button>
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
            <CardTitle className="text-base">Condutores cadastrados</CardTitle>
            <CardDescription>Use estes registros para multas, documentos e abastecimentos.</CardDescription>
          </div>
          <Contact className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : drivers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum condutor cadastrado.</p>
          ) : (
            drivers.map((driver) => (
              <div key={driver.id} className="rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-foreground">{driver.nome}</p>
                      <Badge variant="outline" className={driver.ativo ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-700'}>
                        {driver.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-3 flex-wrap">
                      <span>CNH: {driver.cnhNumero || '—'}</span>
                      <span>Cat.: {driver.cnhCategoria || '—'}</span>
                      <span>Validade: {driver.cnhValidade || '—'}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(driver)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(driver.id)}
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
