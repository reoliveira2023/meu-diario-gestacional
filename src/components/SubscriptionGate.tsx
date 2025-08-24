import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, CreditCard } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface SubscriptionGateProps {
  children: React.ReactNode;
  feature?: string;
}

export const SubscriptionGate = ({ children, feature = "este recurso" }: SubscriptionGateProps) => {
  const { subscribed, subscriptionTier, subscriptionEnd, loading, createCheckout } = useSubscription();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (subscribed) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2 p-3 bg-gradient-soft rounded-lg border border-maternal-pink/20">
          <Crown className="w-5 h-5 text-maternal-pink" />
          <span className="text-sm font-medium text-maternal-pink">
            Plano {subscriptionTier} ativo até {subscriptionEnd?.toLocaleDateString('pt-BR')}
          </span>
        </div>
        {children}
      </div>
    );
  }

  const handleSubscribe = async () => {
    setIsCreatingCheckout(true);
    try {
      await createCheckout();
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  return (
    <Card className="text-center bg-gradient-soft border-maternal-pink/20">
      <CardHeader className="pb-4">
        <div className="mx-auto w-16 h-16 bg-gradient-maternal rounded-full flex items-center justify-center mb-4">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-maternal-pink">
          Acesso Premium Necessário
        </CardTitle>
        <CardDescription>
          Para usar {feature}, você precisa de uma assinatura Premium
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="bg-background rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">MaternaApp Premium</span>
              <Badge variant="default" className="bg-maternal-pink">
                Mais Popular
              </Badge>
            </div>
            <div className="text-left space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>Acesso completo a todas as funcionalidades</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>Galeria de fotos ilimitada</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>Compartilhamento com família</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>Backup automático na nuvem</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>Suporte premium</span>
              </div>
            </div>
            <div className="text-center pt-2 border-t">
              <span className="text-2xl font-bold text-maternal-pink">R$ 29,99</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSubscribe} 
          disabled={isCreatingCheckout}
          className="w-full bg-gradient-maternal hover:bg-gradient-maternal/90 text-white font-medium py-3 shadow-soft hover:shadow-floating transition-all duration-300"
          size="lg"
        >
          <CreditCard className="w-5 h-5 mr-2" />
          {isCreatingCheckout ? "Processando..." : "Assinar Agora"}
        </Button>

        <p className="text-xs text-muted-foreground">
          🔒 Pagamento seguro processado pelo Stripe<br />
          Cancele a qualquer momento
        </p>
      </CardContent>
    </Card>
  );
};