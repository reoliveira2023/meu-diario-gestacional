import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Heart, UserCheck, Mail, Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function FamilyInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [inviterName, setInviterName] = useState('');
  const [step, setStep] = useState<'loading' | 'invalid' | 'form' | 'success'>('loading');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!token) {
      setStep('invalid');
      return;
    }
    
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      // Use the new secure function to get invitation data
      const { data: invitationData, error: invitationError } = await supabase
        .rpc('get_invitation_by_token', { token_param: token });

      if (invitationError || !invitationData || invitationData.length === 0) {
        console.error('Invitation not found:', invitationError);
        setStep('invalid');
        return;
      }

      const invitation = invitationData[0];
      setInvitation({
        id: invitation.id,
        invited_name: invitation.invited_name,
        relationship: invitation.relationship,
        invited_email: invitation.invited_email,
        invitation_message: invitation.invitation_message,
        created_at: invitation.created_at,
        expires_at: invitation.expires_at
      });
      setInviterName(invitation.inviter_name || 'uma futura mamãe');
      setFormData(prev => ({ ...prev, email: invitation.invited_email }));
      setStep('form');
    } catch (error) {
      console.error('Error fetching invitation:', error);
      setStep('invalid');
    }
  };

  const handleAcceptInvitation = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Senhas não coincidem",
        description: "Por favor, verifique se as senhas são iguais.",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    setLoading(true);

    try {
      // Create user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: invitation.invited_name,
            is_family_member: true
          }
        }
      });

      if (signUpError) {
        // Check if user already exists
        if (signUpError.message.includes('already')) {
          // Try to sign in instead
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });

          if (signInError) {
            throw new Error('Este email já está cadastrado. Tente fazer login ou recuperar a senha.');
          }
        } else {
          throw signUpError;
        }
      }

      // Accept the invitation using the database function
      const { data: result, error: acceptError } = await supabase
        .rpc('add_verified_family_member', {
          invitation_token_param: token,
          accept_invitation: true
        }) as { data: { success: boolean; error?: string } | null; error: any };

      if (acceptError) throw acceptError;

      if (!result?.success) {
        throw new Error(result?.error || 'Erro ao aceitar convite');
      }

      setStep('success');
      
      toast({
        title: "Convite aceito!",
        description: "Bem-vindo à família! Você já pode acompanhar a jornada.",
      });

      // Redirect after a delay
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast({
        variant: "destructive",
        title: "Erro ao aceitar convite",
        description: error.message || "Tente novamente ou entre em contato.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectInvitation = async () => {
    setLoading(true);

    try {
      const { data: result, error } = await supabase
        .rpc('add_verified_family_member', {
          invitation_token_param: token,
          accept_invitation: false
        }) as { data: { success: boolean; error?: string } | null; error: any };

      if (error) throw error;

      toast({
        title: "Convite recusado",
        description: "O convite foi recusado com sucesso.",
      });

      navigate('/auth');
    } catch (error: any) {
      console.error('Error rejecting invitation:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao recusar convite.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-maternal">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white" />
      </div>
    );
  }

  if (step === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-maternal p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl">Convite Inválido</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Este convite não é válido ou já expirou.
            </p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-maternal p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Bem-vindo à Família! 🎉</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Convite aceito com sucesso! Você será redirecionado em instantes...
            </p>
            <div className="animate-pulse">
              <Heart className="h-8 w-8 text-primary mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-maternal p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🤱 Materna</h1>
          <p className="text-white/80">Convite para Família</p>
        </div>

        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="h-16 w-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Você foi convidado(a)! 💝</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Heart className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <strong>{inviterName}</strong> gostaria de compartilhar sua jornada materna com você!
              </AlertDescription>
            </Alert>

            {invitation && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-3">Sobre você:</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Nome:</strong> {invitation.invited_name}</p>
                  <p><strong>Parentesco:</strong> {invitation.relationship}</p>
                  {invitation.phone && (
                    <p><strong>Telefone:</strong> {invitation.phone}</p>
                  )}
                </div>
              </div>
            )}

            {invitation?.invitation_message && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <h3 className="font-medium text-amber-800 mb-2">Mensagem especial:</h3>
                <p className="text-amber-700 italic">"{invitation.invitation_message}"</p>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">✨ Como visualizador, você poderá:</h3>
              <ul className="text-green-700 text-sm space-y-1 ml-4">
                <li>• Ver fotos e momentos especiais da gravidez</li>
                <li>• Curtir e comentar nas fotos</li>
                <li>• Acompanhar o crescimento do bebê</li>
                <li>• Ler cartas especiais para o bebê</li>
                <li>• Enviar mensagens de apoio e carinho</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Criar sua Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha (min. 6 caracteres)"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Digite sua senha novamente"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button 
                onClick={handleAcceptInvitation} 
                disabled={loading || !formData.password || !formData.confirmPassword}
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                🌟 Aceitar Convite
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleRejectInvitation}
                disabled={loading}
              >
                Recusar
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Ao aceitar, você concorda em acompanhar esta jornada materna especial com respeito e carinho.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}