import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import AppHeader from "@/components/AppHeader";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Loader2, CheckCircle2, Send } from "lucide-react";
import { confirmarCargaAcademica, fetchCargaActual, CargaAcademica } from "@/services/inscripcionesService";

interface EnrolledSubject {
  id: string;
  materia_id: string;
  codigo: string;
  nombre: string;
  creditos: number;
  horario: string;
}

export default function MySubjects() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [enrolled, setEnrolled] = useState<EnrolledSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [carga, setCarga] = useState<CargaAcademica | null>(null);

  const fetchData = async () => {
    if (!profile) return;
    setLoading(true);
    const [{ data }, cargaData] = await Promise.all([
      supabase
        .from("inscripciones")
        .select("id, materia_id, materias(codigo, nombre, creditos, horario)")
        .eq("usuario_id", profile.id)
        .eq("estado", "inscrita"),
      fetchCargaActual(profile.id),
    ]);

    setEnrolled((data || []).map((d: any) => ({
      id: d.id,
      materia_id: d.materia_id,
      codigo: d.materias?.codigo || "",
      nombre: d.materias?.nombre || "",
      creditos: d.materias?.creditos || 0,
      horario: d.materias?.horario || "",
    })));
    setCarga(cargaData);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [profile]);

  const totalCredits = enrolled.reduce((s, e) => s + e.creditos, 0);

  const handleConfirm = async () => {
    if (!profile) return;
    setConfirming(true);
    try {
      const result = await confirmarCargaAcademica(profile.id);
      toast({ title: "¡Carga enviada!", description: result.message });
      setShowConfirmDialog(false);
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setConfirming(false);
    }
  };

  const cargaStatusBadge = () => {
    if (!carga) return null;
    switch (carga.estado) {
      case "pendiente":
        return <Badge className="bg-warning/10 text-warning border-warning/20">⏳ Pendiente de aprobación</Badge>;
      case "aprobada":
        return <Badge className="bg-primary/10 text-primary border-primary/20">✅ Carga aprobada</Badge>;
      case "rechazada":
        return (
          <div className="space-y-1">
            <Badge variant="destructive">❌ Carga rechazada</Badge>
            {carga.comentario_admin && (
              <p className="text-xs text-muted-foreground">Motivo: {carga.comentario_admin}</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (!profile) return null;

  const canConfirm = enrolled.length > 0 && (!carga || carga.estado === "rechazada");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <div className="mb-6 animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" /> Mis Materias
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Consulta tu carga académica y envíala para aprobación</p>
        </div>

        {/* Credits progress bar */}
        <Card className="glass-card mb-6 animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Créditos inscritos</span>
              <span className="font-display font-bold text-lg text-foreground">{totalCredits} / 21</span>
            </div>
            <Progress value={(totalCredits / 21) * 100} className="h-3" />
          </CardContent>
        </Card>

        {/* Stats + Carga status */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <Card className="glass-card">
            <CardContent className="pt-6 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Materias</span>
              <span className="font-display text-2xl font-bold text-foreground">{enrolled.length}</span>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Créditos</span>
              <span className="font-display text-2xl font-bold text-foreground">{totalCredits}</span>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6 flex flex-col items-center justify-center gap-2">
              <span className="text-muted-foreground text-sm">Estado de carga</span>
              {cargaStatusBadge() || <span className="text-xs text-muted-foreground">Sin enviar</span>}
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : enrolled.length === 0 ? (
          <Card className="glass-card animate-fade-in">
            <CardContent className="py-12 text-center text-muted-foreground">
              No tienes materias inscritas. Ve al catálogo para inscribirte.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: "200ms" }}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="text-center">Créditos</TableHead>
                      <TableHead>Horario</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrolled.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-mono text-xs">{e.codigo}</TableCell>
                        <TableCell className="font-medium">{e.nombre}</TableCell>
                        <TableCell className="text-center">{e.creditos}</TableCell>
                        <TableCell className="text-sm">{e.horario}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Confirm button */}
            {canConfirm && (
              <div className="mt-6 flex justify-center animate-fade-in" style={{ animationDelay: "300ms" }}>
                <Button
                  size="lg"
                  onClick={() => setShowConfirmDialog(true)}
                  className="gap-2 px-8"
                >
                  <Send className="h-5 w-5" />
                  Confirmar Carga Académica
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Confirmar Carga Académica
            </DialogTitle>
            <DialogDescription>
              Estás a punto de enviar tu carga académica para aprobación del coordinador.
              Una vez enviada, no podrás agregar ni cancelar materias hasta que sea procesada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p><strong>Materias:</strong> {enrolled.length}</p>
            <p><strong>Créditos totales:</strong> {totalCredits}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancelar</Button>
            <Button onClick={handleConfirm} disabled={confirming} className="gap-1">
              {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Confirmar y Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
