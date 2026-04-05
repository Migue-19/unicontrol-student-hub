import { useState, useEffect, useMemo } from "react";
import AdminHeader from "@/components/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Eye, BookOpen, GraduationCap } from "lucide-react";
import { fetchEstudiantes, fetchHistorialEstudiante, Estudiante } from "@/services/adminService";

export default function AdminEstudiantes() {
  const { toast } = useToast();
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Estudiante | null>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchEstudiantes();
        setEstudiantes(data);
      } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Group students by career
  const groupedByCarrera = useMemo(() => {
    const groups = new Map<string, { carrera_nombre: string; estudiantes: Estudiante[] }>();
    estudiantes.forEach((e) => {
      const key = e.carrera_id;
      if (!groups.has(key)) {
        groups.set(key, { carrera_nombre: e.carrera_nombre || "Sin carrera", estudiantes: [] });
      }
      groups.get(key)!.estudiantes.push(e);
    });
    return Array.from(groups.entries()).sort((a, b) => a[1].carrera_nombre.localeCompare(b[1].carrera_nombre));
  }, [estudiantes]);

  const viewHistorial = async (est: Estudiante) => {
    setSelectedStudent(est);
    setLoadingHistorial(true);
    try {
      const data = await fetchHistorialEstudiante(est.id);
      setHistorial(data);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoadingHistorial(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="container py-8">
        <div className="mb-6 animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" /> Estudiantes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Estudiantes de tu facultad organizados por carrera · {estudiantes.length} total
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : estudiantes.length === 0 ? (
          <Card className="glass-card animate-fade-in">
            <CardContent className="py-12 text-center text-muted-foreground">No hay estudiantes en tu facultad</CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" defaultValue={groupedByCarrera.map(([k]) => k)} className="space-y-4 animate-fade-in">
            {groupedByCarrera.map(([carreraId, group]) => (
              <AccordionItem key={carreraId} value={carreraId} className="border-0">
                <Card className="glass-card overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-display font-semibold text-foreground">{group.carrera_nombre}</h3>
                        <p className="text-xs text-muted-foreground">{group.estudiantes.length} estudiante{group.estudiantes.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 pb-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead className="text-center">Semestre</TableHead>
                            <TableHead className="text-center">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.estudiantes.map((e) => (
                            <TableRow key={e.id}>
                              <TableCell className="font-medium">{e.nombre}</TableCell>
                              <TableCell className="font-mono text-xs">{e.codigo_estudiantil}</TableCell>
                              <TableCell className="text-center">{e.semestre_actual}</TableCell>
                              <TableCell className="text-center">
                                <Button size="sm" variant="outline" onClick={() => viewHistorial(e)} className="gap-1">
                                  <Eye className="h-3.5 w-3.5" /> Historial
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </main>

      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Historial de {selectedStudent?.nombre}
            </DialogTitle>
            <DialogDescription>
              {selectedStudent?.carrera_nombre} · Semestre {selectedStudent?.semestre_actual} · Código: {selectedStudent?.codigo_estudiantil}
            </DialogDescription>
          </DialogHeader>
          {loadingHistorial ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : historial.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Sin registros de inscripción</p>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Materia</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="text-center">Créditos</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historial.map((h: any) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.materia_nombre}</TableCell>
                      <TableCell className="font-mono text-xs">{h.materia_codigo}</TableCell>
                      <TableCell className="text-center">{h.materia_creditos}</TableCell>
                      <TableCell className="text-xs">{h.materia_horario}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-primary/10 text-primary border-primary/20">{h.estado}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
