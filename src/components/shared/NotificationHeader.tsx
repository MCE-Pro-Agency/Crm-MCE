import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, CheckCheck, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Ajout de la prop onNotificationClick pour la redirection
interface NotificationHeaderProps {
  userId: string;
  onNotificationClick: (projectId: string) => void;
}

export const NotificationHeader = ({ userId, onNotificationClick }: NotificationHeaderProps) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel(`user-notifs-${userId}`)
      .on(
        'postgres_changes', 
        { 
          event: 'INSERT', // On écoute spécifiquement les nouveaux ajouts
          schema: 'public', 
          table: 'notifications', 
          filter: `profile_id=eq.${userId}` 
        }, 
        (payload) => {
          // 2. On rafraîchit la liste de la cloche
          fetchNotifications();

          // 3. ON AJOUTE LE TOAST ICI pour l'alerte en bas
          toast.info(payload.new.title, {
            description: payload.new.message,
            action: {
              label: "Voir",
              onClick: () => {
                if (payload.new.project_id) {
                  onNotificationClick(payload.new.project_id);
                }
              }
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchNotifications = async () => {
    if (!userId) return;
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false })
      .limit(15);

    if (error) {
      console.error("Erreur Notifs:", error.message);
      return;
    }

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel(`user-notifs-${userId}`)
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications', 
          filter: `profile_id=eq.${userId}` 
        }, 
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('profile_id', userId)
      .eq('is_read', false);
    fetchNotifications();
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    fetchNotifications();
  };

  // NOUVELLE FONCTION : Gère le clic sur une notification
  const handleItemClick = async (n: any) => {
    // 1. Marquer comme lu si ce n'est pas déjà fait
    if (!n.is_read) {
      await markAsRead(n.id);
    }
    
    // 2. Fermer le menu déroulant
    setIsOpen(false);
    
    // 3. Si la notification est liée à un projet, on déclenche la redirection
    if (n.project_id) {
      onNotificationClick(n.project_id);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-slate-100 rounded-full transition-all active:scale-95"
      >
        <Bell className={cn("w-6 h-6 transition-colors", isOpen ? "text-primary" : "text-slate-500")} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="text-[10px] flex items-center gap-1 text-primary hover:underline font-semibold"
              >
                <CheckCheck className="w-3 h-3" /> Tout lire
              </button>
            )}
          </div>

          <ScrollArea className="h-80">
            {notifications.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">Aucune notification</div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id}
                  onClick={() => handleItemClick(n)} // Utilisation de la nouvelle fonction
                  className={cn(
                    "p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors relative",
                    !n.is_read && "bg-primary/[0.03]"
                  )}
                >
                  {!n.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <span className={cn("text-xs font-bold", n.is_read ? "text-slate-600" : "text-slate-900")}>
                        {n.title}
                      </span>
                      <span className="text-[9px] text-slate-400 flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 Leadsing-snug">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};