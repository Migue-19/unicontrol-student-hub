import { useState, useEffect } from "react";
import AdminHeader from "@/components/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquarePlus, Mail, MailOpen, Send } from "lucide-react";
import { fetchMensajes, fetchEstudiantes, enviarMensaje, marcarLeido, MensajeData, Estudiante } from "@/services/adminService";

export default function AdminMensajes() {
  const { toast } = useToast();
  const [mensajes, setMensajes] = useState<MensajeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [newMsg, setNewMsg] = useState({ receptor_id: "", asunto: "", mensaje: "" });
  const [sending, setSending] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<MensajeData | null>(null);

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

  const openNewDialog = async () => {
    setShowNew(true);
    if (estudiantes.length === 0) {
      try {
        const data = await fetchEstudiantes();
        setEstudiantes(data);
      } catch {}
    }
  };

  const handleSend = async () => {
    if (!newMsg.receptor_id || !newMsg.asunto || !newMsg.mensaje) {
      toast({ title: "Campos requeridos", description: "Completa todos los campos", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await enviarMensaje(newMsg.receptor_id, newMsg.asunto, newMsg.mensaje);
      toast({ title: "Enviado", description: "Mensaje enviado exitosamente" });
      setShowNew(false);
      setNewMsg({ receptor_id: "", asunto: "", mensaje: "" });
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleSelect = async (msg: MensajeData) => {
    setSelectedMsg(msg);
    if (!msg.leido) {
      try { await marcarLeido(msg.id); } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="container py-8">
        <div className="mb-6 animate-fade-in flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Mail className="h-7 w-7 text-primary" /> Mensajería
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Comunicación con estudiantes de tu facultad</p>
          </div>
          <Button onClick={openNewDialog} className="gap-2">
            <MessageSquarePlus className="h-4 w-4" /> Nuevo Mensaje
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : mensajes.length === 0 ? (
          <Card className="glass-card animate-fade-in">
            <CardContent className="py-12 text-center text-muted-foreground">No hay mensajes</CardContent>
          </Card>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {mensajes.filter(m => !m.parent_id).map((m) => {
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
                        <p className="text-sm text-muted-foreground truncate">Para: {m.receptor_nombre}</p>
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

      {/* New message dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Mensaje</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Destinatario</Label>
              <Select value={newMsg.receptor_id} onValueChange={(v) => setNewMsg(p => ({ ...p, receptor_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar estudiante" /></SelectTrigger>
                <SelectContent>
                  {estudiantes.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nombre} ({e.codigo_estudiantil})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Asunto</Label>
              <Input value={newMsg.asunto} onChange={(e) => setNewMsg(p => ({ ...p, asunto: e.target.value }))} placeholder="Asunto del mensaje" />
            </div>
            <div>
              <Label>Mensaje</Label>
              <Textarea value={newMsg.mensaje} onChange={(e) => setNewMsg(p => ({ ...p, mensaje: e.target.value }))} placeholder="Escribe tu mensaje..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleSend} disabled={sending} className="gap-1">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View message dialog */}
      <Dialog open={!!selectedMsg} onOpenChange={() => setSelectedMsg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedMsg?.asunto}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>De: {selectedMsg?.emisor_nombre}</span>
              <span>Para: {selectedMsg?.receptor_nombre}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">{selectedMsg?.mensaje}</p>
            {selectedMsg && mensajes.filter(r => r.parent_id === selectedMsg.id).map((reply) => (
              <div key={reply.id} className="border-l-2 border-primary/30 pl-3 space-y-1">
                <p className="text-xs text-muted-foreground">
                  {reply.emisor_nombre} · {new Date(reply.created_at).toLocaleDateString("es-CO")}
                </p>
                <p className="text-sm">{reply.mensaje}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
