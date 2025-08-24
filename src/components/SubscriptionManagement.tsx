import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Calendar, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { SubscriptionGate } from "@/components/SubscriptionGate";

export const SubscriptionManagement = () => {
  const { subscribed, subscriptionTier, subscriptionEnd, loading, checkSubscription, createCheckout } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!subscribed) {
    return (
      <SubscriptionGate feature="o MaternaApp completo">
        <div />
      </SubscriptionGate>
    );
  }

  const isExpiringSoon = subscriptionEnd && subscriptionEnd < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6">
      {/* Status da Assinatura */}
      <Card className={`border-2 ${subscribed ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {subscribed ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700">Assinatura Ativa</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700">Assinatura Inativa</span>
              </>
            )}
          </CardTitle>
          <CardDescription>
            {subscribed ? "Você tem acesso completo ao MaternaApp" : "Assine para ter acesso completo"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscribed && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                <Crown className="w-5 h-5 text-maternal-pink" />
                <div>
                  <p className="font-medium">Plano Atual</p>
                  <Badge variant="default" className="bg-maternal-pink">
                    {subscriptionTier}
                  </Badge>
                </div>
              </div>
              
              {subscriptionEnd && (
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <Calendar className={`w-5 h-5 ${isExpiringSoon ? 'text-amber-500' : 'text-green-600'}`} />
                  <div>
                    <p className="font-medium">Próxima Cobrança</p>
                    <p className={`text-sm ${isExpiringSoon ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      {subscriptionEnd.toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {isExpiringSoon && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Atenção: Assinatura expira em breve!</span>
              </div>
              <p className="text-sm text-amber-600 mt-1">
                Sua assinatura será renovada automaticamente em {subscriptionEnd?.toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={checkSubscription} 
              variant="outline" 
              className="flex-1"
            >
              Atualizar Status
            </Button>
            
            {subscribed && (
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.open('https://billing.stripe.com/p/login/test_00000000000001', '_blank')}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Gerenciar Pagamento
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recursos Premium */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-maternal-pink" />
            Recursos Premium
          </CardTitle>
          <CardDescription>
            Todos os recursos inclusos na sua assinatura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Galeria de fotos ilimitada</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Linha do tempo interativa</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Diário de humor e sintomas</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Cartas para o bebê</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Compartilhamento familiar</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Controle médico completo</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Backup automático</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Suporte prioritário</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};