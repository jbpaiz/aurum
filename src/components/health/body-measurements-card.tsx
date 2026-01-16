'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useHealth } from '@/contexts/health-context'
import { BodyMeasurement, MEASUREMENT_LABELS } from '@/types/health'
import { Plus, Pencil, Trash2, Ruler } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface BodyMeasurementsCardProps {
  onAddClick: () => void
  onEditClick: (measurement: BodyMeasurement) => void
}

export function BodyMeasurementsCard({ onAddClick, onEditClick }: BodyMeasurementsCardProps) {
  const { bodyMeasurements, deleteBodyMeasurement } = useHealth()
  const [showAll, setShowAll] = useState(false)

  const latest = bodyMeasurements[0]
  const displayMeasurements = showAll ? bodyMeasurements : bodyMeasurements.slice(0, 3)

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta medição?')) return

    try {
      await deleteBodyMeasurement(id)
      toast.success('Medição excluída com sucesso')
    } catch (error) {
      console.error('Erro ao excluir medição:', error)
      toast.error('Erro ao excluir medição')
    }
  }

  const formatMeasurement = (value: number | null) => {
    return value ? `${value.toFixed(1)} cm` : '-'
  }

  const formatPercentage = (value: number | null) => {
    return value ? `${value.toFixed(1)}%` : '-'
  }

  const formatKg = (value: number | null) => {
    return value ? `${value.toFixed(1)} kg` : '-'
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-purple-500" />
              <div>
                <CardTitle>Medidas Corporais</CardTitle>
                <CardDescription>Acompanhe a evolução das suas medidas</CardDescription>
              </div>
            </div>
            <Button onClick={onAddClick} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Medição
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {bodyMeasurements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ruler className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma medição registrada</p>
              <p className="text-sm">Clique em &quot;Nova Medição&quot; para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Latest Measurement Summary */}
              {latest && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Última Medição</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(latest.measurementDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditClick(latest)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(latest.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {latest.waist && (
                      <div>
                        <p className="text-xs text-muted-foreground">{MEASUREMENT_LABELS.waist}</p>
                        <p className="font-medium">{formatMeasurement(latest.waist)}</p>
                      </div>
                    )}
                    {latest.hips && (
                      <div>
                        <p className="text-xs text-muted-foreground">{MEASUREMENT_LABELS.hips}</p>
                        <p className="font-medium">{formatMeasurement(latest.hips)}</p>
                      </div>
                    )}
                    {latest.chest && (
                      <div>
                        <p className="text-xs text-muted-foreground">{MEASUREMENT_LABELS.chest}</p>
                        <p className="font-medium">{formatMeasurement(latest.chest)}</p>
                      </div>
                    )}
                    {latest.neck && (
                      <div>
                        <p className="text-xs text-muted-foreground">{MEASUREMENT_LABELS.neck}</p>
                        <p className="font-medium">{formatMeasurement(latest.neck)}</p>
                      </div>
                    )}
                    {latest.armLeft && (
                      <div>
                        <p className="text-xs text-muted-foreground">{MEASUREMENT_LABELS.armLeft}</p>
                        <p className="font-medium">{formatMeasurement(latest.armLeft)}</p>
                      </div>
                    )}
                    {latest.armRight && (
                      <div>
                        <p className="text-xs text-muted-foreground">{MEASUREMENT_LABELS.armRight}</p>
                        <p className="font-medium">{formatMeasurement(latest.armRight)}</p>
                      </div>
                    )}
                    {latest.thighLeft && (
                      <div>
                        <p className="text-xs text-muted-foreground">{MEASUREMENT_LABELS.thighLeft}</p>
                        <p className="font-medium">{formatMeasurement(latest.thighLeft)}</p>
                      </div>
                    )}
                    {latest.thighRight && (
                      <div>
                        <p className="text-xs text-muted-foreground">{MEASUREMENT_LABELS.thighRight}</p>
                        <p className="font-medium">{formatMeasurement(latest.thighRight)}</p>
                      </div>
                    )}
                    {latest.calfLeft && (
                      <div>
                        <p className="text-xs text-muted-foreground">{MEASUREMENT_LABELS.calfLeft}</p>
                        <p className="font-medium">{formatMeasurement(latest.calfLeft)}</p>
                      </div>
                    )}
                    {latest.calfRight && (
                      <div>
                        <p className="text-xs text-muted-foreground">{MEASUREMENT_LABELS.calfRight}</p>
                        <p className="font-medium">{formatMeasurement(latest.calfRight)}</p>
                      </div>
                    )}
                    {latest.bodyFatPercentage && (
                      <div>
                        <p className="text-xs text-muted-foreground">{MEASUREMENT_LABELS.bodyFatPercentage}</p>
                        <p className="font-medium">{formatPercentage(latest.bodyFatPercentage)}</p>
                      </div>
                    )}
                    {latest.muscleMass && (
                      <div>
                        <p className="text-xs text-muted-foreground">{MEASUREMENT_LABELS.muscleMass}</p>
                        <p className="font-medium">{formatKg(latest.muscleMass)}</p>
                      </div>
                    )}
                  </div>

                  {latest.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Observações</p>
                      <p className="text-sm">{latest.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* History */}
              {bodyMeasurements.length > 1 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Histórico</h4>
                  <div className="space-y-2">
                    {displayMeasurements.slice(1).map(measurement => (
                      <div
                        key={measurement.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {format(new Date(measurement.measurementDate), "dd/MM/yyyy")}
                          </p>
                          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                            {measurement.waist && <span>Cintura: {formatMeasurement(measurement.waist)}</span>}
                            {measurement.hips && <span>Quadril: {formatMeasurement(measurement.hips)}</span>}
                            {measurement.bodyFatPercentage && <span>BF: {formatPercentage(measurement.bodyFatPercentage)}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEditClick(measurement)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(measurement.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {bodyMeasurements.length > 3 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowAll(!showAll)}
                    >
                      {showAll ? 'Ver menos' : `Ver todas (${bodyMeasurements.length})`}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
