import { useState, useEffect } from "react";
import AdminHeader from "@/components/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, ClipboardList, Filter, Eye, Send } from "lucide-react";
import { fetchCargasPendientes, resolverSolicitud, enviarMensaje, CargaPendiente } from "@/services/adminService";

export default function AdminSolicitudes() {
  const { toast } = useToast();
  const [cargas, setCargas] = useState<CargaPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("pendiente");
  const [processing, setProcessing] = useState<string | null>(null);
  const [detailDialog, setDetailDialog] = useState<CargaPendiente | null>(null);
  const [actionDialog, setActionDialog] = useState<{ carga: CargaPendiente; accion: "aprobar" | "rechazar" } | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [asunto, setAsunto] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchCargasPendientes(filtro);
      setCargas(data);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filtro]);

  const openAction = (carga: CargaPendiente, accion: "aprobar" | "rechazar") => {
    setActionDialog({ carga, accion });
    setAsunto(accion === "aprobar"
      ? "Carga Académica Aprobada"
      : "Carga Académica Rechazada");
    setMensaje(accion === "aprobar"
      ? `Estimado/a ${carga.estudiante_nombre}, su carga académica ha sido aprobada por la coordinación.`
      : "");
  };

  const handleAction = async () => {
    if (!actionDialog) return;
    const { carga, accion } = actionDialog;
    setProcessing(carga.id);
    try {
      await resolverSolicitud(carga.id, accion, mensaje || undefined);

      // Send notification message to student
      if (asunto && mensaje) {
        await enviarMensaje(carga.usuario_id, asunto, mensaje);
      }

      toast({
        title: accion === "aprobar" ? "Aprobada" : "Rechazada",
        description: `Carga de ${carga.estudiante_nombre} ${accion === "aprobar" ? "aprobada" : "rechazada"}`,
      });
      setActionDialog(null);
      setMensaje("");
      setAsunto("");
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const estadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente": return <Badge className="bg-warning/10 text-warning border-warning/20">Pendiente</Badge>;
      case "aprobada": return <Badge className="bg-primary/10 text-primary border-primary/20">Aprobada</Badge>;
      case "rechazada": return <Badge variant="destructive">Rechazada</Badge>;
      default: return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="container py-8">
        <div className="mb-6 animate-fade-in flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="h-7 w-7 text-primary" /> Cargas Académicas
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Gestiona las cargas académicas de los estudiantes de tu facultad</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filtro} onValueChange={setFiltro}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="aprobada">Aprobadas</SelectItem>
                <SelectItem value="rechazada">Rechazadas</SelectItem>
                <SelectItem value="todas">Todas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : cargas.length === 0 ? (
          <Card className="glass-card animate-fade-in">
            <CardContent className="py-12 text-center text-muted-foreground">
              No hay cargas académicas {filtro !== "todas" ? filtro + "s" : ""}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {cargas.map((c) => {
              const totalCredits = (c.materias || []).reduce((s, m) => s + m.creditos, 0);
              return (
                <Card key={c.id} className="glass-card overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-display font-semibold text-foreground">{c.estudiante_nombre}</h3>
                        <p className="text-xs text-muted-foreground">
                          {c.estudiante_codigo} · {c.estudiante_carrera} · {(c.materias || []).length} materias · {totalCredits} créditos
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {estadoBadge(c.estado)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.fecha_solicitud).toLocaleDateString("es-CO")}
                        </span>
                      </div>
                    </div>

                    {/* Subject preview */}
                    <div className="overflow-x-auto mb-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Código</TableHead>
                            <TableHead className="text-xs">Materia</TableHead>
                            <TableHead className="text-xs text-center">Créditos</TableHead>
                            <TableHead className="text-xs">Horario</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(c.materias || []).map((m) => (
                            <TableRow key={m.id}>
                              <TableCell className="font-mono text-xs">{m.codigo}</TableCell>
                              <TableCell className="text-sm">{m.nombre}</TableCell>
                              <TableCell className="text-center text-sm">{m.creditos}</TableCell>
                              <TableCell className="text-xs">{m.horario}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Actions */}
                    {c.estado === "pendiente" && (
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => openAction(c, "aprobar")}
                          disabled={processing === c.id}
                          className="gap-1"
                        >
                          {processing === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openAction(c, "rechazar")}
                          disabled={processing === c.id}
                          className="gap-1"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Rechazar
                        </Button>
                      </div>
                    )}

                    {c.comentario_admin && c.estado !== "pendiente" && (
                      <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
                        Comentario: {c.comentario_admin}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Approve/Reject with message dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setMensaje(""); setAsunto(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.accion === "aprobar" ? "Aprobar" : "Rechazar"} Carga Académica
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.accion === "aprobar"
                ? `Aprobar la carga académica de ${actionDialog?.carga.estudiante_nombre}`
                : `Rechazar la carga académica de ${actionDialog?.carga.estudiante_nombre}`
              }. Se enviará un mensaje de notificación al estudiante.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Asunto del mensaje</Label>
              <Input
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                placeholder="Asunto"
              />
            </div>
            <div>
              <Label>Mensaje para el estudiante</Label>
              <Textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder={actionDialog?.accion === "rechazar" ? "Motivo del rechazo..." : "Mensaje de notificación..."}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionDialog(null); setMensaje(""); setAsunto(""); }}>
              Cancelar
            </Button>
            <Button
              variant={actionDialog?.accion === "rechazar" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={!!processing}
              className="gap-1"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {actionDialog?.accion === "aprobar" ? "Aprobar y Notificar" : "Rechazar y Notificar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
