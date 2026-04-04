import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, MailOpen, Send } from "lucide-react";
import { fetchMensajes, enviarMensaje, marcarLeido, MensajeData } from "@/services/adminService";

export default function StudentMessages() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [mensajes, setMensajes] = useState<MensajeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<MensajeData | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchMensajes();
      setMensajes(data);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSelect = async (msg: MensajeData) => {
    setSelectedMsg(msg);
    if (!msg.leido && msg.receptor_id === profile?.id) {
      try { await marcarLeido(msg.id); } catch {}
    }
  };

  const handleReply = async () => {
    if (!selectedMsg || !reply.trim()) return;
    setSending(true);
    try {
      await enviarMensaje(
        selectedMsg.emisor_id,
        `Re: ${selectedMsg.asunto}`,
        reply,
        selectedMsg.id
      );
      toast({ title: "Respuesta enviada" });
      setReply("");
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  // Only show messages where student is the recipient (root messages)
  const rootMessages = mensajes.filter(m => !m.parent_id && m.receptor_id === profile?.id);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <div className="mb-6 animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="h-7 w-7 text-primary" /> Mis Mensajes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Mensajes de la coordinación académica. Puedes responder a cada mensaje.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : rootMessages.length === 0 ? (
          <Card className="glass-card animate-fade-in">
            <CardContent className="py-12 text-center text-muted-foreground">No tienes mensajes</CardContent>
          </Card>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {rootMessages.map((m) => {
              const replies = mensajes.filter(r => r.parent_id === m.id);
              return (
                <Card key={m.id} className="glass-card cursor-pointer hover:shadow-lg transition-all" onClick={() => handleSelect(m)}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {m.leido ? <MailOpen className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-primary" />}
                          <span className="font-medium text-foreground truncate">{m.asunto}</span>
                          {!m.leido && <Badge className="bg-primary/10 text-primary text-xs">Nuevo</Badge>}
                          {replies.length > 0 && <Badge variant="secondary" className="text-xs">{replies.length} respuesta{replies.length > 1 ? "s" : ""}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">De: {m.emisor_nombre}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(m.created_at).toLocaleDateString("es-CO")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={!!selectedMsg} onOpenChange={() => { setSelectedMsg(null); setReply(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedMsg?.asunto}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>De: {selectedMsg?.emisor_nombre}</span>
              <span>{selectedMsg ? new Date(selectedMsg.created_at).toLocaleDateString("es-CO") : ""}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">{selectedMsg?.mensaje}</p>
            
            {selectedMsg && mensajes.filter(r => r.parent_id === selectedMsg.id).map((r) => (
              <div key={r.id} className="border-l-2 border-primary/30 pl-3 space-y-1">
                <p className="text-xs text-muted-foreground">
                  {r.emisor_nombre} · {new Date(r.created_at).toLocaleDateString("es-CO")}
                </p>
                <p className="text-sm">{r.mensaje}</p>
              </div>
            ))}

            <div className="border-t pt-3">
              <Textarea placeholder="Escribe tu respuesta..." value={reply} onChange={(e) => setReply(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleReply} disabled={sending || !reply.trim()} className="gap-1">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Responder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
