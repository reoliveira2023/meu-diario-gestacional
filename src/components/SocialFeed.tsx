import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FamilyMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  message_type: string;
  created_at: string;
}

interface Like {
  id: string;
  user_id: string;
  photo_id?: string;
  timeline_event_id?: string;
  created_at: string;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export const SocialFeed = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<FamilyMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFamilyMembers();
      fetchMessages();
    }
  }, [user]);

  const fetchFamilyMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (error) {
      console.error("Error fetching family members:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("family_messages")
        .select("*")
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedMember) {
      toast.error("Selecione um familiar e digite uma mensagem");
      return;
    }

    try {
      const { error } = await supabase
        .from("family_messages")
        .insert({
          sender_id: user?.id,
          recipient_id: selectedMember,
          content: newMessage.trim(),
          message_type: "text"
        });

      if (error) throw error;

      setNewMessage("");
      toast.success("Mensagem enviada!");
      fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Área de Nova Mensagem */}
      <Card className="bg-gradient-soft border-maternal-pink/20 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-maternal-pink">
            <MessageCircle className="w-5 h-5" />
            Enviar Mensagem Carinhosa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {familyMembers.length === 0 ? (
            <div className="text-center p-6 bg-maternal-pink/5 rounded-lg">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Adicione familiares para começar a conversar
              </p>
            </div>
          ) : (
            <>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full p-3 border border-maternal-pink/20 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-maternal-pink"
              >
                <option value="">Escolha quem vai receber sua mensagem</option>
                {familyMembers.map((member: any) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.relationship})
                  </option>
                ))}
              </select>
              
              <div className="flex gap-3">
                <Input
                  placeholder="Escreva uma mensagem especial..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 border-maternal-pink/20 focus:border-maternal-pink"
                />
                <Button 
                  onClick={sendMessage}
                  className="bg-maternal-pink hover:bg-maternal-pink/90"
                  disabled={!newMessage.trim() || !selectedMember}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Feed de Mensagens */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-maternal-pink" />
            Mensagens da Família
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Ainda não há mensagens</p>
              <p className="text-sm">Comece uma conversa com sua família!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 p-4 rounded-lg transition-all hover:shadow-soft ${
                    message.sender_id === user?.id
                      ? "bg-maternal-pink/10 ml-8"
                      : "bg-secondary/30 mr-8"
                  }`}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-maternal-pink text-primary-foreground">
                      {message.sender_id === user?.id ? "V" : "F"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {message.sender_id === user?.id 
                          ? "Você" 
                          : "Familiar"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};