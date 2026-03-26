import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import { useToast } from "@/hooks/use-toast";
import { Trash2, GraduationCap, Loader2 } from "lucide-react";

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
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchEnrolled = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from("inscripciones")
      .select("id, materia_id, materias(codigo, nombre, creditos, horario)")
      .eq("usuario_id", profile.id)
      .eq("estado", "inscrita");

    setEnrolled((data || []).map(d => ({
      id: d.id,
      materia_id: d.materia_id,
      codigo: (d.materias as any)?.codigo || "",
      nombre: (d.materias as any)?.nombre || "",
      creditos: (d.materias as any)?.creditos || 0,
      horario: (d.materias as any)?.horario || "",
    })));
    setLoading(false);
  };

  useEffect(() => { fetchEnrolled(); }, [profile]);

  const totalCredits = enrolled.reduce((s, e) => s + e.creditos, 0);

  const handleCancel = async (materiaId: string) => {
    if (!profile) return;
    setCancelling(materiaId);
    const { data, error } = await supabase.rpc("cancelar_inscripcion", {
      p_usuario_id: profile.id,
      p_materia_id: materiaId,
    });
    setCancelling(null);
    const result = data as any;
    toast({
      title: result?.success ? "Cancelada" : "Error",
      description: result?.message || error?.message || "Error",
      variant: result?.success ? "default" : "destructive",
    });
    if (result?.success) fetchEnrolled();
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <div className="mb-6 animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" /> Mis Materias
          </h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mb-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <Card className="glass-card">
            <CardContent className="pt-6 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Materias inscritas</span>
              <span className="font-display text-2xl font-bold text-foreground">{enrolled.length}</span>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Créditos totales</span>
              <span className="font-display text-2xl font-bold text-foreground">{totalCredits} / 21</span>
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
          <Card className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-center">Créditos</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead className="text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolled.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-xs">{e.codigo}</TableCell>
                      <TableCell className="font-medium">{e.nombre}</TableCell>
                      <TableCell className="text-center">{e.creditos}</TableCell>
                      <TableCell className="text-sm">{e.horario}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancel(e.materia_id)}
                          disabled={cancelling === e.materia_id}
                          className="gap-1"
                        >
                          {cancelling === e.materia_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          Cancelar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
