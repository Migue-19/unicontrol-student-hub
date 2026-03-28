import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import { useToast } from "@/hooks/use-toast";
import { Trash2, XCircle, Loader2 } from "lucide-react";
import { ActiveEnrollment, cancelEnrollment, fetchActiveEnrollments } from "@/services/inscripcionesService";

export default function CancelSubjects() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [enrolled, setEnrolled] = useState<ActiveEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchEnrolled = async ({ throwOnError = false }: { throwOnError?: boolean } = {}): Promise<ActiveEnrollment[]> => {
    if (!profile) {
      setEnrolled([]);
      setLoading(false);
      return [];
    }

    setLoading(true);

    try {
      const activeEnrollments = await fetchActiveEnrollments(profile.id);
      setEnrolled(activeEnrollments);
      return activeEnrollments;
    } catch (error) {
      console.error("[CancelSubjects] fetchEnrolled error:", error);
      setEnrolled([]);

      if (throwOnError) {
        throw error;
      }

      toast({
        title: "Error al cargar materias",
        description: "No fue posible sincronizar tus materias desde Supabase.",
        variant: "destructive",
      });

      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchEnrolled();
  }, [profile]);

  const handleCancel = async (materiaId: string) => {
    if (!profile) return;

    setCancelling(materiaId);

    try {
      const result = await cancelEnrollment(materiaId);
      setEnrolled(result.enrollments);

      toast({
        title: "Materia cancelada correctamente",
        description: result.message,
      });
    } catch (error) {
      console.error("[CancelSubjects] handleCancel error:", error);
      toast({
        title: "Error al cancelar materia",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setCancelling(null);
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <div className="mb-6 animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <XCircle className="h-7 w-7 text-destructive" /> Cancelar Materias
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Selecciona las materias que deseas cancelar. Los cupos se liberan automáticamente.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : enrolled.length === 0 ? (
          <Card className="glass-card animate-fade-in">
            <CardContent className="py-12 text-center text-muted-foreground">
              No tienes materias inscritas para cancelar.
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: "100ms" }}>
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
