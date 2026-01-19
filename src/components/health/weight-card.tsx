'use client'

import { useEffect, useMemo, useState, type MouseEvent, type TouchEvent } from 'react'
import { TrendingUp, TrendingDown, Minus, Edit2, Trash2, Plus, Minus as MinusIcon } from 'lucide-react'
import { useHealth } from '@/contexts/health-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { addDays, differenceInYears, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { WeightLog } from '@/types/health'
import { toast } from 'sonner'

interface WeightCardProps {
  detailed?: boolean
  onAddClick?: () => void
  onEditClick?: (log: WeightLog) => void
}

export function WeightCard({ detailed = false, onAddClick, onEditClick }: WeightCardProps) {
  const { weightLogs, weightStats, deleteWeightLog, createWeightLog, userStats } = useHealth()
  const [heightCm, setHeightCm] = useState<string>('')
  const [birthDate, setBirthDate] = useState<string>('')
  const [sex, setSex] = useState<string>('')
  const [activityLevel, setActivityLevel] = useState<string>('')
  const [bodyFat, setBodyFat] = useState<string>('')
  const [barInsight, setBarInsight] = useState<{
    kind: 'bmi' | 'bmr' | 'tdee'
    title: string
    value: string
    note: string
    percent: number
  } | null>(null)

  // Carregar perfil do usuário do contexto
  useEffect(() => {
    if (userStats?.heightCm !== undefined && userStats?.heightCm !== null) {
      setHeightCm(String(userStats.heightCm))
    }
    if (userStats?.birthDate) {
      setBirthDate(userStats.birthDate.split('T')[0] || userStats.birthDate)
    }
    if (userStats?.sex) {
      setSex(userStats.sex)
    }
    if (userStats?.activityLevel) {
      setActivityLevel(userStats.activityLevel)
    }
    if (userStats?.bodyFatPercentage !== undefined && userStats?.bodyFatPercentage !== null) {
      setBodyFat(String(userStats.bodyFatPercentage))
    }
  }, [userStats?.heightCm, userStats?.birthDate, userStats?.sex, userStats?.activityLevel, userStats?.bodyFatPercentage])

  const parsedHeightM = useMemo(() => {
    const cm = parseFloat(heightCm)
    if (Number.isNaN(cm) || cm <= 0) return null
    return cm / 100
  }, [heightCm])

  const parsedHeightCm = useMemo(() => {
    const cm = parseFloat(heightCm)
    if (Number.isNaN(cm) || cm <= 0) return null
    return cm
  }, [heightCm])

  const bmi = useMemo(() => {
    if (!weightStats?.current || !parsedHeightM) return null
    const value = weightStats.current / (parsedHeightM * parsedHeightM)
    return Number(value.toFixed(1))
  }, [weightStats?.current, parsedHeightM])

  const bmiStatus = useMemo(() => {
    if (!bmi) return null
    if (bmi < 18.5) return { label: 'Abaixo do peso', color: 'bg-amber-100 text-amber-800 border-amber-300' }
    if (bmi < 25) return { label: 'Peso saudável', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
    if (bmi < 30) return { label: 'Sobrepeso', color: 'bg-orange-100 text-orange-800 border-orange-300' }
    if (bmi < 35) return { label: 'Obesidade I', color: 'bg-red-100 text-red-800 border-red-300' }
    if (bmi < 40) return { label: 'Obesidade II', color: 'bg-red-200 text-red-900 border-red-400' }
    return { label: 'Obesidade III', color: 'bg-red-300 text-red-900 border-red-500' }
  }, [bmi])

  const bmiBar = useMemo(() => {
    if (!bmi) return null
    const min = 14
    const max = 40
    const clamped = Math.min(max, Math.max(min, bmi))
    const percent = ((clamped - min) / (max - min)) * 100
    return { percent, min, max }
  }, [bmi])

  const age = useMemo(() => {
    if (!birthDate) return null
    const parsed = new Date(birthDate)
    if (Number.isNaN(parsed.getTime())) return null
    return differenceInYears(new Date(), parsed)
  }, [birthDate])

  const bodyFatValue = useMemo(() => {
    if (!bodyFat) return null
    const parsed = parseFloat(bodyFat)
    if (Number.isNaN(parsed) || parsed <= 0) return null
    return parsed
  }, [bodyFat])

  const activityFactor = useMemo(() => {
    if (!activityLevel) return null
    const map: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      athlete: 1.9
    }
    return map[activityLevel] ?? null
  }, [activityLevel])

  const bmrInfo = useMemo(() => {
    if (!weightStats?.current) return null

    const hasMifflinInputs = parsedHeightCm && age !== null
    const mifflin = hasMifflinInputs
      ? 10 * weightStats.current + 6.25 * (parsedHeightCm as number) - 5 * (age as number) + (sex === 'male' ? 5 : sex === 'female' ? -161 : -78)
      : null

    const katch = bodyFatValue !== null
      ? 370 + 21.6 * (weightStats.current * (1 - bodyFatValue / 100))
      : null

    const value = katch ?? mifflin
    if (!value) return null

    const min = 1100
    const max = 3200
    const clamped = Math.min(max, Math.max(min, Math.round(value)))
    const percent = ((clamped - min) / (max - min)) * 100
    let label = 'Moderado'
    if (clamped < 1500) label = 'Baixo'
    else if (clamped > 2400) label = 'Alto'
    return { value: Math.round(value), clamped, percent, min, max, label, formula: katch ? 'katch' : 'mifflin' }
  }, [age, bodyFatValue, parsedHeightCm, sex, weightStats?.current])

  const tdeeInfo = useMemo(() => {
    if (!bmrInfo || !activityFactor) return null
    const value = Math.round(bmrInfo.value * activityFactor)
    const min = 1500
    const max = 5000
    const clamped = Math.min(max, Math.max(min, value))
    const percent = ((clamped - min) / (max - min)) * 100
    return { value, clamped, percent, min, max, factor: activityFactor }
  }, [activityFactor, bmrInfo])

  const describeValue = (kind: 'bmi' | 'bmr' | 'tdee', value: number) => {
    if (kind === 'bmi') {
      if (value < 18.5) return { title: 'IMC', note: 'Abaixo do peso' }
      if (value < 25) return { title: 'IMC', note: 'Peso saudável' }
      if (value < 30) return { title: 'IMC', note: 'Sobrepeso' }
      if (value < 35) return { title: 'IMC', note: 'Obesidade I' }
      if (value < 40) return { title: 'IMC', note: 'Obesidade II' }
      return { title: 'IMC', note: 'Obesidade III' }
    }
    if (kind === 'bmr') return { title: 'Taxa metabólica basal', note: 'Estimativa diária em repouso' }
    return { title: 'Calorias de manutenção (TDEE)', note: 'Inclui nível de atividade' }
  }

  const handleBarPoint = (kind: 'bmi' | 'bmr' | 'tdee', min: number, max: number) => (
    event: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const clientX = 'touches' in event ? event.touches[0]?.clientX : event.clientX
    if (clientX === undefined) return
    const percent = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const value = min + percent * (max - min)
    const { title, note } = describeValue(kind, value)
    setBarInsight({
      kind,
      title,
      note,
      value: `${kind === 'bmi' ? value.toFixed(1) : value.toFixed(0)} ${kind === 'bmi' ? 'IMC' : 'kcal/dia'}`,
      percent: percent * 100
    })
  }

  const clearBarPoint = () => setBarInsight(null)

  const renderBarInsight = (kind: 'bmi' | 'bmr' | 'tdee') => {
    if (!barInsight || barInsight.kind !== kind) return null
    return (
      <div
        className="pointer-events-none absolute bottom-full mb-2 z-10 min-w-[180px] rounded-md border bg-background/95 p-2 text-xs shadow-lg"
        style={{ left: `${barInsight.percent}%`, transform: 'translateX(-50%)' }}
      >
        <p className="font-semibold leading-tight">{barInsight.title}</p>
        <p className="text-sm leading-tight">{barInsight.value}</p>
        <p className="text-[11px] text-muted-foreground leading-tight">{barInsight.note}</p>
      </div>
    )
  }

  // Edição de perfil foi movida para Health → Perfil e metas

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro?')) return
    
    try {
      await deleteWeightLog(id)
      toast.success('Registro excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir registro')
    }
  }

  const recentLogs = useMemo(() => {
    return weightLogs.slice(0, detailed ? 30 : 5)
  }, [weightLogs, detailed])

  const latestLog = weightLogs[0]

  const getTrendIcon = () => {
    if (!weightStats) return <Minus className="h-4 w-4 text-muted-foreground" />
    if (weightStats.trend === 'up') return <TrendingUp className="h-4 w-4 text-orange-500" />
    if (weightStats.trend === 'down') return <TrendingDown className="h-4 w-4 text-green-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getTrendColor = () => {
    if (!weightStats) return 'text-muted-foreground'
    if (weightStats.trend === 'up') return 'text-orange-500'
    if (weightStats.trend === 'down') return 'text-green-500'
    return 'text-muted-foreground'
  }

  const handleQuickAdjust = async (delta: number) => {
    if (!latestLog) return
    try {
      await createWeightLog({ weight: Number((latestLog.weight + delta).toFixed(2)) })
      toast.success('Peso registrado rapidamente')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao registrar ajuste rápido')
    }
  }

  return weightStats ? (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-3">
          <span>Peso</span>
          <div className="flex flex-wrap gap-2 justify-end">
            {[-0.6, -0.5, -0.2, -0.1, 0.1, 0.2, 0.5, 0.6].map(delta => (
              <Button
                key={delta}
                size="sm"
                variant="secondary"
                onClick={() => handleQuickAdjust(delta)}
                className="flex items-center gap-1"
              >
                {delta < 0 ? <MinusIcon className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {Math.abs(delta)} kg
              </Button>
            ))}
            {onAddClick && (
              <Button size="sm" variant="outline" onClick={onAddClick}>
                Adicionar
              </Button>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          {weightStats.todayCount > 0 ? 'Peso de hoje' : 'Última medição'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Weight */}
        <div className="space-y-1">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">{weightStats.current}</span>
            <span className="text-xl text-muted-foreground mb-1">kg</span>
            {getTrendIcon()}
          </div>
          {weightStats.changeFromYesterday !== null && (
            <p className={`text-sm ${getTrendColor()}`}>
              {weightStats.changeFromYesterday > 0 ? '+' : ''}
              {weightStats.changeFromYesterday.toFixed(1)} kg desde ontem
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Mínimo</p>
            <p className="text-sm font-medium">{weightStats.min} kg</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Média</p>
            <p className="text-sm font-medium">{weightStats.avg?.toFixed(1)} kg</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Máximo</p>
            <p className="text-sm font-medium">{weightStats.max} kg</p>
          </div>
        </div>

        {/* Goal Progress (somente leitura, edição no Perfil) */}
        {weightStats.goalTarget && (
          <div className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Meta de peso</p>
                <p className="text-xs text-muted-foreground">Configure em Saúde → Perfil e metas</p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <a href="/health/profile">Abrir perfil</a>
              </Button>
            </div>

            <div className="space-y-2">
              <Progress value={Math.min(100, Math.max(0, (weightStats.goalProgress || 0) * 100))} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Meta</p>
                  <p className="text-sm font-semibold">{weightStats.goalTarget} kg</p>
                  {weightStats.goalDate && (
                    <p className="text-[11px] text-muted-foreground">Até {format(new Date(weightStats.goalDate), 'dd/MM/yyyy')}</p>
                  )}
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Atual</p>
                  <p className="text-sm font-semibold">{weightStats.current} kg</p>
                  <p className="text-[11px] text-muted-foreground">Mede hoje {weightStats.todayCount > 0 ? '✔' : '—'}</p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Restam</p>
                  <p className="text-sm font-semibold">
                    {weightStats.current !== null && weightStats.goalTarget !== null
                      ? `${Math.max(0, Math.abs(weightStats.current - weightStats.goalTarget)).toFixed(1)} kg`
                      : '—'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Para alcançar a meta</p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">ETA</p>
                  <p className="text-sm font-semibold">
                    {weightStats.etaWeeksToGoal ? `~${weightStats.etaWeeksToGoal.toFixed(0)} sem` : 'Indeterminado'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {weightStats.etaWeeksToGoal
                      ? `Estimado: ${format(addDays(new Date(), weightStats.etaWeeksToGoal * 7), 'dd/MM/yyyy')}`
                      : 'Data estimada indisponível'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Mantendo o ritmo atual</p>
                </div>
              </div>

              {weightStats.goalExpectedToday !== null && weightStats.goalExpectedToday !== undefined && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border bg-muted/30 p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Para estar no ritmo</p>
                    <p className="text-sm font-semibold">{weightStats.goalExpectedToday.toFixed(1)} kg</p>
                    <p className="text-[11px] text-muted-foreground">Peso esperado para hoje</p>
                  </div>
                  {weightStats.goalDeltaFromExpected !== null && weightStats.goalDeltaFromExpected !== undefined && (
                    <div className="rounded-md border bg-muted/30 p-3 space-y-1">
                      <p className="text-xs text-muted-foreground">Diferença hoje</p>
                      <p className="text-sm font-semibold">
                        {Math.abs(weightStats.goalDeltaFromExpected).toFixed(1)} kg {weightStats.goalDeltaFromExpected > 0 ? 'acima' : 'abaixo'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">Em relação ao esperado</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Perfil e IMC (somente leitura, edição em Perfil e metas) */}
        <div className="rounded-md border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Perfil corporal</p>
              <p className="text-xs text-muted-foreground">Edite em Saúde → Perfil e metas</p>
            </div>
            {bmi && bmiStatus && (
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${bmiStatus.color}`}>
                IMC {bmi} · {bmiStatus.label}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>Altura: {heightCm || '—'} cm</span>
            <span>Data de nascimento: {birthDate || '—'}</span>
            <span>Sexo: {sex || '—'}</span>
            <span>Nível de atividade: {activityLevel || '—'}</span>
            <span>% gordura: {bodyFat || '—'}</span>
          </div>
          {bmiBar ? (
            <div className="space-y-1">
              <div className="relative pb-6">
                {renderBarInsight('bmi')}
                <div
                  role="button"
                  tabIndex={0}
                  onMouseMove={handleBarPoint('bmi', bmiBar.min, bmiBar.max)}
                  onTouchStart={handleBarPoint('bmi', bmiBar.min, bmiBar.max)}
                  onTouchMove={handleBarPoint('bmi', bmiBar.min, bmiBar.max)}
                  onMouseLeave={clearBarPoint}
                  onTouchEnd={clearBarPoint}
                  onTouchCancel={clearBarPoint}
                  className="relative h-3 rounded-full overflow-hidden cursor-pointer outline-none"
                  style={{
                    background: 'linear-gradient(90deg, #bae6fd 0%, #a7f3d0 35%, #fef08a 55%, #fdba74 75%, #fecdd3 100%)'
                  }}
                >
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-foreground"
                    style={{ left: `${bmiBar.percent}%`, transform: 'translateX(-50%)' }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>IMC baixo ~{bmiBar.min}</span>
                <span>IMC alto ~{bmiBar.max}</span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">Informe altura e tenha um peso recente para ver o IMC.</p>
          )}
          <div className="flex justify-end">
            <Button size="sm" variant="outline" asChild>
              <a href="/health/profile">Abrir Perfil e metas</a>
            </Button>
          </div>
        </div>

        {/* BMR */}
        {bmrInfo ? (
          <div className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Taxa metabólica basal</p>
                <p className="text-xs text-muted-foreground">{bmrInfo.formula === 'katch' ? 'Usando Katch-McArdle (gordura informada)' : 'Usando Mifflin-St Jeor (peso/altura/idade/sexo)'}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">{bmrInfo.value} kcal/dia</p>
                <p className="text-[11px] text-muted-foreground">{bmrInfo.label}</p>
              </div>
            </div>
              <div className="relative pb-6">
                {renderBarInsight('bmr')}
                <div
                  role="button"
                  tabIndex={0}
                  onMouseMove={handleBarPoint('bmr', bmrInfo.min, bmrInfo.max)}
                  onTouchStart={handleBarPoint('bmr', bmrInfo.min, bmrInfo.max)}
                  onTouchMove={handleBarPoint('bmr', bmrInfo.min, bmrInfo.max)}
                  onMouseLeave={clearBarPoint}
                  onTouchEnd={clearBarPoint}
                  onTouchCancel={clearBarPoint}
                  className="relative h-3 rounded-full bg-gradient-to-r from-sky-200 via-amber-200 to-rose-200 overflow-hidden cursor-pointer outline-none"
                >
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-foreground"
                    style={{ left: `${bmrInfo.percent}%`, transform: 'translateX(-50%)' }}
                  />
                </div>
              </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Baixo ~{bmrInfo.min} kcal</span>
              <span>Alto ~{bmrInfo.max} kcal</span>
            </div>
          </div>
        ) : (
          <div className="rounded-md border p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Taxa metabólica basal</p>
              <p className="text-xs text-muted-foreground">Informe peso, altura + idade + sexo ou % gordura para ver a estimativa.</p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <a href="/health/profile">Completar perfil</a>
            </Button>
          </div>
        )}

        {tdeeInfo ? (
          <div className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Calorias de manutenção (TDEE)</p>
                <p className="text-xs text-muted-foreground">Multiplica BMR pelo nível de atividade</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">{tdeeInfo.value} kcal/dia</p>
                <p className="text-[11px] text-muted-foreground">Fator {tdeeInfo.factor.toFixed(2)}</p>
              </div>
            </div>
              <div className="relative pb-6">
                {renderBarInsight('tdee')}
                <div
                  role="button"
                  tabIndex={0}
                  onMouseMove={handleBarPoint('tdee', tdeeInfo.min, tdeeInfo.max)}
                  onTouchStart={handleBarPoint('tdee', tdeeInfo.min, tdeeInfo.max)}
                  onTouchMove={handleBarPoint('tdee', tdeeInfo.min, tdeeInfo.max)}
                  onMouseLeave={clearBarPoint}
                  onTouchEnd={clearBarPoint}
                  onTouchCancel={clearBarPoint}
                  className="relative h-3 rounded-full bg-gradient-to-r from-emerald-200 via-amber-200 to-rose-300 overflow-hidden cursor-pointer outline-none"
                >
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-foreground"
                    style={{ left: `${tdeeInfo.percent}%`, transform: 'translateX(-50%)' }}
                  />
                </div>
              </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Baixo ~{tdeeInfo.min} kcal</span>
              <span>Alto ~{tdeeInfo.max} kcal</span>
            </div>
          </div>
        ) : (
          <div className="rounded-md border p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Calorias de manutenção (TDEE)</p>
              <p className="text-xs text-muted-foreground">Complete o nível de atividade para estimar as calorias de manutenção.</p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <a href="/health/profile">Definir nível</a>
            </Button>
          </div>
        )}

        {/* Recent Logs */}
        {detailed && recentLogs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Histórico</h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {recentLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0 gap-2">
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{log.weight} kg</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.recordedAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                    {log.note && (
                      <span className="text-xs text-muted-foreground mt-1">
                        {log.note}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {onEditClick && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => onEditClick(log)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(log.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  ) : (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Peso</span>
          {onAddClick && (
            <Button size="sm" variant="outline" onClick={onAddClick}>
              Adicionar
            </Button>
          )}
        </CardTitle>
        <CardDescription>Nenhum registro ainda</CardDescription>
      </CardHeader>
    </Card>
  )
}
