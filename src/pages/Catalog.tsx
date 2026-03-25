import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { subjectService } from "@/services/subjectService";
import { enrollmentService } from "@/services/enrollmentService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AppHeader from "@/components/AppHeader";
import { useToast } from "@/hooks/use-toast";
import { BookPlus, Filter } from "lucide-react";
import { carreras } from "@/services/mockData";

export default function Catalog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [carrera, setCarrera] = useState(user?.carrera || "");
  const [semestre, setSemestre] = useState<string>("all");
  const [, forceUpdate] = useState(0);

  const subjects = useMemo(() => {
    if (!carrera) return [];
    return subjectService.getByCarreraAndSemestre(
      carrera,
      semestre === "all" ? undefined : parseInt(semestre)
    );
  }, [carrera, semestre, forceUpdate]); // eslint-disable-line

  const userEnrollments = user ? enrollmentService.getByUser(user.id) : [];
  const enrolledIds = new Set(userEnrollments.map((e) => e.subjectId));

  const handleEnroll = (subjectId: string) => {
    if (!user) return;
    const result = enrollmentService.enroll(user.id, subjectId);
    toast({
      title: result.success ? "¡Inscrito!" : "Error",
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
          <h1 className="font-display text-2xl font-bold text-foreground">Catálogo de Materias</h1>
          <p className="text-muted-foreground text-sm mt-1">Consulta e inscribe materias disponibles</p>
        </div>

        <Card className="glass-card mb-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select value={carrera} onValueChange={setCarrera}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona carrera" />
                  </SelectTrigger>
                  <SelectContent>
                    {carreras.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-48">
                <Select value={semestre} onValueChange={setSemestre}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semestre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {[1,2,3,4,5,6,7,8,9,10].map((s) => (
                      <SelectItem key={s} value={s.toString()}>Semestre {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {subjects.length === 0 ? (
          <Card className="glass-card animate-fade-in">
            <CardContent className="py-12 text-center text-muted-foreground">
              {carrera ? "No hay materias para estos filtros" : "Selecciona una carrera para ver materias"}
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card animate-fade-in overflow-hidden" style={{ animationDelay: "200ms" }}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-center">Créditos</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead className="text-center">Cupos</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((s) => {
                    const isEnrolled = enrolledIds.has(s.id);
                    const noSlots = s.cuposDisponibles === 0;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.codigo}</TableCell>
                        <TableCell className="font-medium">{s.nombre}</TableCell>
                        <TableCell className="text-center">{s.creditos}</TableCell>
                        <TableCell className="text-sm">{s.horario}</TableCell>
                        <TableCell className="text-center">
                          {s.cuposDisponibles}/{s.cuposTotal}
                        </TableCell>
                        <TableCell className="text-center">
                          {isEnrolled ? (
                            <Badge className="bg-primary/10 text-primary border-0">Inscrito</Badge>
                          ) : noSlots ? (
                            <Badge variant="destructive">Sin cupos</Badge>
                          ) : (
                            <Badge className="bg-accent text-accent-foreground border-0">Disponible</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            onClick={() => handleEnroll(s.id)}
                            disabled={isEnrolled || noSlots}
                            className="gap-1"
                          >
                            <BookPlus className="h-3.5 w-3.5" />
                            Inscribir
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
