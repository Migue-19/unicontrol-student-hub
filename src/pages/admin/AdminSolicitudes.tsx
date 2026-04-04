import { useState, useEffect } from "react";
import AdminHeader from "@/components/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, ClipboardList, Filter } from "lucide-react";
import { fetchSolicitudes, resolverSolicitud, Solicitud } from "@/services/adminService";

export default function AdminSolicitudes() {
  const { toast } = useToast();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("pendiente");
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<Solicitud | null>(null);
  const [comentario, setComentario] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchSolicitudes(filtro);
      setSolicitudes(data);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filtro]);

  const handleAprobar = async (s: Solicitud) => {
    setProcessing(s.id);
    try {
      await resolverSolicitud(s.id, "aprobar");
      toast({ title: "Aprobada", description: `Solicitud de ${s.estudiante_nombre} aprobada` });
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleRechazar = async () => {
    if (!rejectDialog) return;
    setProcessing(rejectDialog.id);
    try {
      await resolverSolicitud(rejectDialog.id, "rechazar", comentario);
      toast({ title: "Rechazada", description: `Solicitud rechazada` });
      setRejectDialog(null);
      setComentario("");
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
      case "inscrita": return <Badge className="bg-primary/10 text-primary border-primary/20">Aprobada</Badge>;
      case "rechazada": return <Badge variant="destructive">Rechazada</Badge>;
      default: return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  const tipoBadge = (tipo: string) => {
    return tipo === "adicion"
      ? <Badge variant="secondary" className="bg-accent text-accent-foreground">Adición</Badge>
      : <Badge variant="secondary" className="bg-destructive/10 text-destructive">Cancelación</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="container py-8">
        <div className="mb-6 animate-fade-in flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="h-7 w-7 text-primary" /> Solicitudes
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Gestiona las solicitudes de inscripción y cancelación</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filtro} onValueChange={setFiltro}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="inscrita">Aprobadas</SelectItem>
                <SelectItem value="todas">Todas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : solicitudes.length === 0 ? (
          <Card className="glass-card animate-fade-in">
            <CardContent className="py-12 text-center text-muted-foreground">
              No hay solicitudes {filtro !== "todas" ? filtro + "s" : ""}
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Materia</TableHead>
                    <TableHead className="text-center">Tipo</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    {filtro === "pendiente" && <TableHead className="text-center">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solicitudes.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.estudiante_nombre}</TableCell>
                      <TableCell className="font-mono text-xs">{s.estudiante_codigo}</TableCell>
                      <TableCell>
                        <div>{s.materia_nombre}</div>
                        <div className="text-xs text-muted-foreground">{s.materia_codigo} · {s.materia_creditos} cr · {s.materia_horario}</div>
                      </TableCell>
                      <TableCell className="text-center">{tipoBadge(s.tipo)}</TableCell>
                      <TableCell className="text-center">{estadoBadge(s.estado)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(s.fecha_solicitud).toLocaleDateString("es-CO")}
                      </TableCell>
                      {filtro === "pendiente" && (
                        <TableCell className="text-center">
                          <div className="flex gap-1 justify-center">
                            <Button
                              size="sm"
                              onClick={() => handleAprobar(s)}
                              disabled={processing === s.id}
                              className="gap-1"
                            >
                              {processing === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setRejectDialog(s)}
                              disabled={processing === s.id}
                              className="gap-1"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Rechazar
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </main>

      <Dialog open={!!rejectDialog} onOpenChange={() => { setRejectDialog(null); setComentario(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Solicitud</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Rechazar la solicitud de <strong>{rejectDialog?.estudiante_nombre}</strong> para{" "}
              <strong>{rejectDialog?.materia_nombre}</strong>
            </p>
            <Textarea
              placeholder="Motivo del rechazo (opcional)"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog(null); setComentario(""); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRechazar} disabled={!!processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
