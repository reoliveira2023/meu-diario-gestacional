import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Stethoscope, Calendar as CalendarIcon, FileText, Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MedicalRecord {
  id: string;
  type: 'exam' | 'appointment';
  title: string;
  date: Date;
  doctor: string;
  location: string;
  notes: string;
  results?: string;
  attachments?: string[];
  week: number;
}

const examTypes = [
  "Ultrassom", "Hemograma", "Glicemia", "Toxoplasmose", "Rubéola", 
  "Sífilis", "HIV", "Hepatite B", "Urina", "Curva Glicêmica", 
  "Streptococo", "Morfológica", "Ecocardiografia Fetal"
];

export const MedicalExamsTracker = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [newRecord, setNewRecord] = useState({
    type: 'exam' as 'exam' | 'appointment',
    title: '',
    date: new Date(),
    doctor: '',
    location: '',
    notes: '',
    results: '',
    week: 0
  });

  const handleSaveRecord = () => {
    if (!newRecord.title || !newRecord.doctor) return;

    const record: MedicalRecord = {
      id: Date.now().toString(),
      ...newRecord,
      attachments: []
    };

    if (editingRecord) {
      setRecords(prev => prev.map(r => r.id === editingRecord ? record : r));
      setEditingRecord(null);
    } else {
      setRecords(prev => [...prev, record]);
    }

    setNewRecord({
      type: 'exam',
      title: '',
      date: new Date(),
      doctor: '',
      location: '',
      notes: '',
      results: '',
      week: 0
    });
    setIsAddingRecord(false);
  };

  const handleEditRecord = (record: MedicalRecord) => {
    setNewRecord({
      type: record.type,
      title: record.title,
      date: record.date,
      doctor: record.doctor,
      location: record.location,
      notes: record.notes,
      results: record.results || '',
      week: record.week
    });
    setEditingRecord(record.id);
    setIsAddingRecord(true);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-primary" />
          Exames e Consultas
        </CardTitle>
        <Button 
          onClick={() => setIsAddingRecord(true)}
          className="bg-gradient-maternal hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Registro
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Formulário de adicionar/editar */}
        {isAddingRecord && (
          <Card className="border-primary/20 bg-gradient-soft">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={newRecord.type === 'exam' ? 'default' : 'outline'}
                      onClick={() => setNewRecord({...newRecord, type: 'exam'})}
                    >
                      Exame
                    </Button>
                    <Button
                      size="sm"
                      variant={newRecord.type === 'appointment' ? 'default' : 'outline'}
                      onClick={() => setNewRecord({...newRecord, type: 'appointment'})}
                    >
                      Consulta
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Semana Gestacional</label>
                  <Input
                    type="number"
                    placeholder="20"
                    value={newRecord.week}
                    onChange={(e) => setNewRecord({...newRecord, week: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do {newRecord.type === 'exam' ? 'Exame' : 'Consulta'}</label>
                {newRecord.type === 'exam' ? (
                  <div className="grid grid-cols-2 gap-2">
                    {examTypes.map(exam => (
                      <Button
                        key={exam}
                        size="sm"
                        variant={newRecord.title === exam ? 'default' : 'outline'}
                        onClick={() => setNewRecord({...newRecord, title: exam})}
                        className="text-xs"
                      >
                        {exam}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <Input
                    placeholder="Ex: Consulta de rotina"
                    value={newRecord.title}
                    onChange={(e) => setNewRecord({...newRecord, title: e.target.value})}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {format(newRecord.date, "dd/MM/yyyy", { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newRecord.date}
                        onSelect={(date) => date && setNewRecord({...newRecord, date})}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Médico</label>
                  <Input
                    placeholder="Dr(a). Nome"
                    value={newRecord.doctor}
                    onChange={(e) => setNewRecord({...newRecord, doctor: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Local</label>
                <Input
                  placeholder="Hospital/Clínica"
                  value={newRecord.location}
                  onChange={(e) => setNewRecord({...newRecord, location: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Observações</label>
                <Textarea
                  placeholder="Observações sobre a consulta/exame..."
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})}
                />
              </div>

              {newRecord.type === 'exam' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Resultados</label>
                  <Textarea
                    placeholder="Resultados do exame..."
                    value={newRecord.results}
                    onChange={(e) => setNewRecord({...newRecord, results: e.target.value})}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSaveRecord} className="flex-1">
                  {editingRecord ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingRecord(false);
                    setEditingRecord(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de registros */}
        {records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum registro médico ainda</p>
            <p className="text-xs">Adicione suas consultas e exames! 🩺</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedRecords.map((record) => (
              <Card key={record.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{record.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(record.date, "dd 'de' MMMM", { locale: ptBR })} • {record.week}ª semana
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={record.type === 'exam' ? 'default' : 'secondary'}>
                        {record.type === 'exam' ? 'Exame' : 'Consulta'}
                      </Badge>
                      <Button size="icon" variant="ghost" onClick={() => handleEditRecord(record)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteRecord(record.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p><strong>Médico:</strong> {record.doctor}</p>
                    <p><strong>Local:</strong> {record.location}</p>
                    {record.notes && <p><strong>Observações:</strong> {record.notes}</p>}
                    {record.results && <p><strong>Resultados:</strong> {record.results}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
