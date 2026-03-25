import { useAuth } from "@/hooks/useAuth";
import { enrollmentService } from "@/services/enrollmentService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BookOpen, GraduationCap, User, XCircle } from "lucide-react";
import AppHeader from "@/components/AppHeader";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const enrolled = enrollmentService.getByUser(user.id);
  const totalCredits = enrollmentService.getTotalCredits(user.id);

  const cards = [
    { title: "Catálogo de Materias", desc: "Consulta e inscribe materias", icon: BookOpen, path: "/catalog", color: "bg-primary/10 text-primary" },
    { title: "Mis Materias", desc: `${enrolled.length} inscritas · ${totalCredits} créditos`, icon: GraduationCap, path: "/my-subjects", color: "bg-accent text-accent-foreground" },
    { title: "Mi Perfil", desc: "Datos personales y configuración", icon: User, path: "/profile", color: "bg-secondary text-secondary-foreground" },
    { title: "Cancelar Materias", desc: "Gestiona tu carga académica", icon: XCircle, path: "/my-subjects", color: "bg-destructive/10 text-destructive" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-foreground">
            ¡Hola, {user.nombre.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {user.carrera} · Semestre {user.semestre}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <Card
              key={card.title}
              className="glass-card hover:shadow-xl transition-all cursor-pointer group animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
              onClick={() => navigate(card.path)}
            >
              <CardHeader className="pb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color} mb-2`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <CardTitle className="font-display text-base">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{card.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {enrolled.length > 0 && (
          <div className="mt-8 animate-fade-in" style={{ animationDelay: "400ms" }}>
            <h2 className="font-display text-xl font-semibold mb-4">Resumen de Inscripciones</h2>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Créditos inscritos</span>
                  <span className="font-display font-bold text-lg text-foreground">{totalCredits} / 21</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary rounded-full h-3 transition-all duration-500"
                    style={{ width: `${(totalCredits / 21) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
