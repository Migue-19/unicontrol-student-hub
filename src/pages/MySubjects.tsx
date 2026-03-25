import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { enrollmentService } from "@/services/enrollmentService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppHeader from "@/components/AppHeader";
import { useToast } from "@/hooks/use-toast";
import { Trash2, GraduationCap } from "lucide-react";

export default function MySubjects() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, forceUpdate] = useState(0);

  if (!user) return null;

  const enrolled = enrollmentService.getByUser(user.id);
  const totalCredits = enrollmentService.getTotalCredits(user.id);

  const handleCancel = (subjectId: string) => {
    const result = enrollmentService.cancel(user.id, subjectId);
    toast({
      title: result.success ? "Cancelada" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
    if (result.success) forceUpdate((n) => n + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <div className="mb-6 animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            Mis Materias
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

        {enrolled.length === 0 ? (
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
                      <TableCell className="font-mono text-xs">{e.subject.codigo}</TableCell>
                      <TableCell className="font-medium">{e.subject.nombre}</TableCell>
                      <TableCell className="text-center">{e.subject.creditos}</TableCell>
                      <TableCell className="text-sm">{e.subject.horario}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancel(e.subjectId)}
                          className="gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
