import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scale, TrendingUp, Plus, Edit, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WeightRecord {
  id: string;
  date: Date;
  weight: number;
  bellyCircumference?: number;
  week: number;
  notes?: string;
}

export const WeightChart = () => {
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newRecord, setNewRecord] = useState({
    weight: '',
    bellyCircumference: '',
    week: '',
    notes: ''
  });

  const handleAddRecord = () => {
    if (!newRecord.weight || !newRecord.week) return;

    const record: WeightRecord = {
      id: Date.now().toString(),
      date: new Date(),
      weight: parseFloat(newRecord.weight),
      bellyCircumference: newRecord.bellyCircumference ? parseFloat(newRecord.bellyCircumference) : undefined,
      week: parseInt(newRecord.week),
      notes: newRecord.notes
    };

    setRecords(prev => [...prev, record].sort((a, b) => a.week - b.week));
    setNewRecord({ weight: '', bellyCircumference: '', week: '', notes: '' });
    setIsAdding(false);
  };

  const chartData = records.map(record => ({
    week: record.week,
    weight: record.weight,
    belly: record.bellyCircumference,
    date: format(record.date, "dd/MM", { locale: ptBR })
  }));

  const latestRecord = records[records.length - 1];
  const firstRecord = records[0];
  const weightGain = latestRecord && firstRecord ? latestRecord.weight - firstRecord.weight : 0;

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          Evolução do Peso e Barriga
        </CardTitle>
        
        {/* Resumo */}
        {latestRecord && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-gradient-soft rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-primary">{latestRecord.weight}kg</p>
              <p className="text-xs text-muted-foreground">Peso atual</p>
            </div>
            <div className="bg-gradient-soft rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-maternal-mint">+{weightGain.toFixed(1)}kg</p>
              <p className="text-xs text-muted-foreground">Ganho total</p>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Formulário de adição */}
        {isAdding ? (
          <Card className="border-primary/20 bg-gradient-soft">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Peso (kg)</label>
                  <Input
                    type="number"
                    placeholder="65.5"
                    value={newRecord.weight}
                    onChange={(e) => setNewRecord({...newRecord, weight: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Semana</label>
                  <Input
                    type="number"
                    placeholder="20"
                    value={newRecord.week}
                    onChange={(e) => setNewRecord({...newRecord, week: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Circunferência da barriga (cm) - Opcional</label>
                <Input
                  type="number"
                  placeholder="85"
                  value={newRecord.bellyCircumference}
                  onChange={(e) => setNewRecord({...newRecord, bellyCircumference: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Observações</label>
                <Input
                  placeholder="Como me sinto hoje..."
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddRecord} className="flex-1">
                  Salvar Medição
                </Button>
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button 
            onClick={() => setIsAdding(true)}
            className="w-full bg-gradient-maternal hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Medição
          </Button>
        )}

        {/* Gráfico */}
        {records.length > 1 ? (
          <div className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="week" 
                    label={{ value: 'Semana', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => `${value}ª semana`}
                    formatter={(value, name) => [
                      `${value}${name === 'weight' ? 'kg' : 'cm'}`,
                      name === 'weight' ? 'Peso' : 'Barriga'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', r: 6 }}
                  />
                  {chartData.some(d => d.belly) && (
                    <Line 
                      type="monotone" 
                      dataKey="belly" 
                      stroke="hsl(var(--maternal-mint))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--maternal-mint))', r: 4 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Legenda */}
            <div className="flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span>Peso (kg)</span>
              </div>
              {chartData.some(d => d.belly) && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-maternal-mint"></div>
                  <span>Barriga (cm)</span>
                </div>
              )}
            </div>
          </div>
        ) : records.length === 1 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Adicione pelo menos 2 medições para ver o gráfico</p>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Scale className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Ainda não há medições registradas</p>
            <p className="text-xs">Comece acompanhando seu peso! ⚖️</p>
          </div>
        )}

        {/* Histórico recente */}
        {records.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Últimas medições:</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {records.slice(-5).reverse().map((record) => (
                <div key={record.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm">
                  <div>
                    <span className="font-medium">{record.weight}kg</span>
                    {record.bellyCircumference && (
                      <span className="text-muted-foreground ml-2">• {record.bellyCircumference}cm</span>
                    )}
                    <span className="text-muted-foreground ml-2">• {record.week}ª sem</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(record.date, "dd/MM", { locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};