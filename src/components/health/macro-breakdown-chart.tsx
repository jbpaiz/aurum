'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useHealth } from '@/contexts/health-context'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

export function MacroBreakdownChart() {
  const { nutritionStats } = useHealth()

  if (!nutritionStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Macronutrientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Registre refeições para ver a distribuição
          </div>
        </CardContent>
      </Card>
    )
  }

  const { todayProtein, todayCarbs, todayFats } = nutritionStats

  // Calcular calorias de cada macro (proteína e carbs = 4 kcal/g, gordura = 9 kcal/g)
  const proteinCalories = todayProtein * 4
  const carbsCalories = todayCarbs * 4
  const fatsCalories = todayFats * 9
  const totalMacroCalories = proteinCalories + carbsCalories + fatsCalories

  const data = [
    {
      name: 'Proteínas',
      value: todayProtein,
      calories: proteinCalories,
      percentage: totalMacroCalories > 0 ? Math.round((proteinCalories / totalMacroCalories) * 100) : 0
    },
    {
      name: 'Carboidratos',
      value: todayCarbs,
      calories: carbsCalories,
      percentage: totalMacroCalories > 0 ? Math.round((carbsCalories / totalMacroCalories) * 100) : 0
    },
    {
      name: 'Gorduras',
      value: todayFats,
      calories: fatsCalories,
      percentage: totalMacroCalories > 0 ? Math.round((fatsCalories / totalMacroCalories) * 100) : 0
    }
  ].filter(item => item.value > 0)

  const COLORS = {
    'Proteínas': 'hsl(210 100% 60%)', // Azul
    'Carboidratos': 'hsl(142 71% 45%)', // Verde
    'Gorduras': 'hsl(48 96% 53%)' // Amarelo
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.value}g</p>
          <p className="text-sm text-muted-foreground">{data.calories} kcal</p>
          <p className="text-sm font-medium">{data.percentage}%</p>
        </div>
      )
    }
    return null
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Macronutrientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Nenhum macronutriente registrado hoje
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Macronutrientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Gráfico de pizza */}
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="calories"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legenda com detalhes */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            {data.map((item) => (
              <div key={item.name} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[item.name as keyof typeof COLORS] }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <p className="text-lg font-bold">{item.value}g</p>
                <p className="text-xs text-muted-foreground">{item.calories} kcal ({item.percentage}%)</p>
              </div>
            ))}
          </div>

          {/* Metas vs Consumido */}
          {nutritionStats.dailyGoals && (
            <div className="space-y-2 pt-4 border-t">
              <h4 className="font-medium text-sm">Metas Diárias</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {nutritionStats.dailyGoals.dailyProtein && (
                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
                    <p className="text-muted-foreground">Proteínas</p>
                    <p className="font-semibold">
                      {Math.round(todayProtein)} / {nutritionStats.dailyGoals.dailyProtein}g
                    </p>
                  </div>
                )}
                {nutritionStats.dailyGoals.dailyCarbohydrates && (
                  <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
                    <p className="text-muted-foreground">Carboidratos</p>
                    <p className="font-semibold">
                      {Math.round(todayCarbs)} / {nutritionStats.dailyGoals.dailyCarbohydrates}g
                    </p>
                  </div>
                )}
                {nutritionStats.dailyGoals.dailyFats && (
                  <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                    <p className="text-muted-foreground">Gorduras</p>
                    <p className="font-semibold">
                      {Math.round(todayFats)} / {nutritionStats.dailyGoals.dailyFats}g
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
