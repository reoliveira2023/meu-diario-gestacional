import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Trash2, Mail, Phone, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  email?: string;
  phone?: string;
  is_invited: boolean;
  invited_at?: string;
  joined_at?: string;
}

const relationshipOptions = [
  'pai', 'mãe', 'avó materna', 'avó paterna', 'avô materno', 'avô paterno',
  'tio', 'tia', 'prima', 'primo', 'irmã', 'irmão', 'sogra', 'sogro',
  'cunhada', 'cunhado', 'madrinha', 'padrinho', 'amiga', 'amigo'
];

export default function FamilyManager() {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    relationship: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (user) {
      fetchFamilyMembers();
    }
  }, [user]);

  const fetchFamilyMembers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar família",
        description: error.message,
      });
    }
  };

  const handleAddMember = async () => {
    if (!user || !newMember.name || !newMember.relationship) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Nome e parentesco são obrigatórios.",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('family_members')
        .insert([
          {
            user_id: user.id,
            name: newMember.name,
            relationship: newMember.relationship,
            email: newMember.email || null,
            phone: newMember.phone || null,
            is_invited: !!newMember.email,
            invited_at: newMember.email ? new Date().toISOString() : null,
          }
        ]);

      if (error) throw error;

      toast({
        title: "Membro adicionado!",
        description: `${newMember.name} foi adicionado à sua família.`,
      });

      setNewMember({ name: '', relationship: '', email: '', phone: '' });
      setIsAddingMember(false);
      fetchFamilyMembers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar membro",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Membro removido",
        description: "O membro foi removido da sua família.",
      });

      fetchFamilyMembers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao remover membro",
        description: error.message,
      });
    }
  };

  const getRelationshipColor = (relationship: string) => {
    const colors = {
      'pai': 'bg-blue-100 text-blue-800',
      'mãe': 'bg-pink-100 text-pink-800',
      'avó materna': 'bg-purple-100 text-purple-800',
      'avó paterna': 'bg-purple-100 text-purple-800',
      'avô materno': 'bg-indigo-100 text-indigo-800',
      'avô paterno': 'bg-indigo-100 text-indigo-800',
    };
    return colors[relationship as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (!user) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Minha Família</CardTitle>
          </div>
          <Button
            onClick={() => setIsAddingMember(true)}
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
        <CardDescription>
          Convide familiares para acompanhar sua jornada materna
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAddingMember && (
          <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Nome do familiar"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationship">Parentesco *</Label>
                <Select
                  value={newMember.relationship}
                  onValueChange={(value) => setNewMember({ ...newMember, relationship: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o parentesco" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddMember} disabled={loading}>
                {loading ? 'Adicionando...' : 'Adicionar Membro'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingMember(false);
                  setNewMember({ name: '', relationship: '', email: '', phone: '' });
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {familyMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum familiar adicionado ainda.</p>
            <p className="text-sm">Comece adicionando membros da sua família!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {familyMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <UserPlus className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className={getRelationshipColor(member.relationship)}>
                        {member.relationship}
                      </Badge>
                      {member.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{member.email}</span>
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteMember(member.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}