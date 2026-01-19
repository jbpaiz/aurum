"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useHealth } from '@/contexts/health-context'
import { addDays, format } from 'date-fns'
import { toast } from 'sonner'
import type { ActivityLevel, UserSex } from '@/types/health'

export function HealthProfileSettings() {
  const {
    weightStats,
    goals,
    createGoal,
    updateGoal,
    updateUserStatsProfile,
    userStats
  } = useHealth()

  const weightGoal = goals.find(g => g.goalType === 'weight' && g.isActive)

  const [goalValue, setGoalValue] = useState('')
  const [goalDate, setGoalDate] = useState('')
  const [savingGoal, setSavingGoal] = useState(false)

  const [heightCm, setHeightCm] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [sex, setSex] = useState('')
  const [activityLevel, setActivityLevel] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    if (weightGoal) {
      setGoalValue(String(weightGoal.targetValue))
      setGoalDate(weightGoal.targetDate ? weightGoal.targetDate.split('T')[0] : '')
    }
  }, [weightGoal])

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

  const bmi = useMemo(() => {
    if (!weightStats?.current) return null
    const h = parseFloat(heightCm)
    if (Number.isNaN(h) || h <= 0) return null
    const m = h / 100
    const value = weightStats.current / (m * m)
    return Number(value.toFixed(1))
  }, [weightStats?.current, heightCm])

  const bmiStatus = useMemo(() => {
    if (!bmi) return null
    if (bmi < 18.5) return { label: 'Abaixo do peso', color: 'bg-amber-100 text-amber-800 border-amber-300' }
    if (bmi < 25) return { label: 'Peso saudável', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
    if (bmi < 30) return { label: 'Sobrepeso', color: 'bg-orange-100 text-orange-800 border-orange-300' }
    if (bmi < 35) return { label: 'Obesidade I', color: 'bg-red-100 text-red-800 border-red-300' }
    if (bmi < 40) return { label: 'Obesidade II', color: 'bg-red-200 text-red-900 border-red-400' }
    return { label: 'Obesidade III', color: 'bg-red-300 text-red-900 border-red-500' }
  }, [bmi])

  const handleSaveGoal = async () => {
    const parsed = parseFloat(goalValue)
    if (Number.isNaN(parsed)) {
      toast.error('Informe um valor de meta válido')
      return
    }
    try {
      setSavingGoal(true)
      if (weightGoal) {
        await updateGoal(weightGoal.id, { targetValue: parsed, targetDate: goalDate || undefined })
      } else {
        await createGoal({ goalType: 'weight', targetValue: parsed, targetDate: goalDate || undefined })
      }
      toast.success('Meta de peso salva')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar meta')
    } finally {
      setSavingGoal(false)
    }
  }

  const handleSaveProfile = async () => {
    const heightValue = heightCm ? parseFloat(heightCm) : null
    const birthDateValue = birthDate || null
    const sexValue = (sex || null) as UserSex | null
    const activityValue = (activityLevel || null) as ActivityLevel | null
    const bodyFatValue = bodyFat ? parseFloat(bodyFat) : null

    if (heightValue !== null && (Number.isNaN(heightValue) || heightValue < 80 || heightValue > 250)) {
      toast.error('Altura inválida. Use cm entre 80 e 250.')
      return
    }
    if (birthDateValue && Number.isNaN(Date.parse(birthDateValue))) {
      toast.error('Data de nascimento inválida')
      return
    }
    if (bodyFat) {
      if (bodyFatValue === null || Number.isNaN(bodyFatValue) || bodyFatValue < 3 || bodyFatValue > 60) {
        toast.error('Percentual de gordura inválido (3% a 60%).')
        return
      }
    }
    

    try {
      setSavingProfile(true)
      await updateUserStatsProfile({
        heightCm: heightValue,
        birthDate: birthDateValue,
        sex: sexValue as any,
        activityLevel: activityValue as any,
        bodyFatPercentage: bodyFatValue
      })
      toast.success('Perfil salvo')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar perfil')
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Ajuste os dados que mudam pouco.</p>
          <h1 className="text-2xl font-bold">Perfil e metas</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Perfil corporal</CardTitle>
            <CardDescription>Defina altura, nascimento, sexo, atividade e gordura para cálculos de IMC/BMR/TDEE.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                type="number"
                step="0.5"
                min="80"
                max="250"
                placeholder="Altura (cm)"
                value={heightCm}
                onChange={e => setHeightCm(e.target.value)}
              />
              <Input
                type="date"
                placeholder="Data de nascimento"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger>
                  <SelectValue placeholder="Sexo biológico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                  <SelectItem value="other">Outro/Prefiro não dizer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={activityLevel} onValueChange={setActivityLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Nível de atividade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentário (1-2k passos/dia)</SelectItem>
                  <SelectItem value="light">Leve (2-5k passos/dia ou 1-2x/sem)</SelectItem>
                  <SelectItem value="moderate">Moderado (5-8k passos/dia ou 3-4x/sem)</SelectItem>
                  <SelectItem value="active">Ativo (8-12k passos/dia ou 4-6x/sem)</SelectItem>
                  <SelectItem value="athlete">Atleta (12k+ passos/dia ou 2 treinos/dia)</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.1"
                min="3"
                max="60"
                placeholder="% gordura (opcional)"
                value={bodyFat}
                onChange={e => setBodyFat(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {bmi && bmiStatus ? (
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${bmiStatus.color}`}>
                      IMC {bmi} · {bmiStatus.label}
                    </span>
                    <span className="text-xs">Baseado no peso atual</span>
                  </div>
                ) : (
                  <p className="text-xs">Informe altura e tenha um peso registrado para ver o IMC.</p>
                )}
              </div>
              <Button size="sm" onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? 'Salvando...' : 'Salvar perfil'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meta de peso</CardTitle>
            <CardDescription>Defina o alvo e a data limite.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                type="number"
                step="0.1"
                placeholder="Peso alvo (kg)"
                value={goalValue}
                onChange={e => setGoalValue(e.target.value)}
              />
              <Input
                type="date"
                value={goalDate}
                onChange={e => setGoalDate(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Peso atual: {weightStats?.current ?? '—'} kg</span>
              {weightStats?.etaWeeksToGoal && weightStats.goalDate && (
                <span>
                  ETA: ~{weightStats.etaWeeksToGoal.toFixed(0)} sem · {format(addDays(new Date(), weightStats.etaWeeksToGoal * 7), 'dd/MM/yyyy')}
                </span>
              )}
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSaveGoal} disabled={savingGoal}>
                {savingGoal ? 'Salvando...' : 'Salvar meta'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
