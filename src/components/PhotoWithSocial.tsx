import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PhotoWithSocialProps {
  photo: {
    id: string;
    url: string;
    caption?: string;
    created_at: string;
    week_number?: number;
  };
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface Like {
  id: string;
  user_id: string;
  created_at: string;
}

export const PhotoWithSocial = ({ photo }: PhotoWithSocialProps) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState<Like[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLikes();
    fetchComments();
  }, [photo.id]);

  const fetchLikes = async () => {
    try {
      const { data, error } = await supabase
        .from("likes")
        .select("*")
        .eq("photo_id", photo.id);

      if (error) throw error;
      
      setLikes(data || []);
      setIsLiked(data?.some((like) => like.user_id === user?.id) || false);
    } catch (error) {
      console.error("Error fetching likes:", error);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("photo_id", photo.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const toggleLike = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (isLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("photo_id", photo.id)
          .eq("user_id", user.id);

        if (error) throw error;
        setIsLiked(false);
        setLikes(prev => prev.filter(like => like.user_id !== user.id));
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({
            user_id: user.id,
            photo_id: photo.id
          });

        if (error) throw error;
        setIsLiked(true);
        setLikes(prev => [...prev, { 
          id: Date.now().toString(), 
          user_id: user.id, 
          created_at: new Date().toISOString() 
        }]);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Erro ao curtir foto");
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          user_id: user.id,
          photo_id: photo.id,
          content: newComment.trim()
        })
        .select("*")
        .single();

      if (error) throw error;

      setComments(prev => [...prev, data]);
      setNewComment("");
      toast.success("Comentário adicionado!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Erro ao adicionar comentário");
    }
  };

  return (
    <Card className="overflow-hidden shadow-card border-0">
      {/* Foto */}
      <div className="relative">
        <img 
          src={photo.url} 
          alt={photo.caption || "Foto da gravidez"} 
          className="w-full aspect-square object-cover"
        />
        {photo.week_number && (
          <div className="absolute top-3 left-3 bg-maternal-pink text-primary-foreground px-3 py-1 rounded-full text-sm font-medium shadow-soft">
            {photo.week_number}ª semana
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Caption */}
        {photo.caption && (
          <p className="text-sm">{photo.caption}</p>
        )}

        {/* Botões de Interação */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLike}
            disabled={loading}
            className={`flex items-center gap-2 hover:bg-maternal-pink/10 ${
              isLiked ? "text-maternal-pink" : "text-muted-foreground"
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            <span className="text-sm">{likes.length}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-muted-foreground hover:bg-secondary/30"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">{comments.length}</span>
          </Button>
        </div>

        {/* Contador de Curtidas */}
        {likes.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {likes.length === 1 ? "1 pessoa curtiu" : `${likes.length} pessoas curtiram`}
          </p>
        )}

        {/* Comentários */}
        {comments.length > 0 && (
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2">
                <Avatar className="w-6 h-6 flex-shrink-0">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-maternal-pink text-primary-foreground text-xs">
                    F
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="bg-secondary/30 rounded-lg px-3 py-2">
                    <p className="text-xs font-medium mb-1">
                      Familiar
                    </p>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-3">
                    {formatDistanceToNow(new Date(comment.created_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Campo de Novo Comentário */}
        <div className="flex gap-2">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-maternal-pink text-primary-foreground text-sm">
              {user?.user_metadata?.preferred_name?.charAt(0) || user?.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Adicione um comentário carinhoso..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addComment()}
              className="flex-1 border-maternal-pink/20 focus:border-maternal-pink text-sm"
            />
            <Button
              size="sm"
              onClick={addComment}
              disabled={!newComment.trim()}
              className="bg-maternal-pink hover:bg-maternal-pink/90 px-3"
            >
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};