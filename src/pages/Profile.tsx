import { useAuth } from "@/hooks/useAuth";
import { enrollmentService } from "@/services/enrollmentService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import { LogOut, RefreshCw, User } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const totalCredits = enrollmentService.getTotalCredits(user.id);
  const enrolled = enrollmentService.getByUser(user.id);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const restartTutorial = () => {
    localStorage.removeItem("unicontrol_onboarding_done");
    navigate("/dashboard");
    window.location.reload();
  };

  const fields = [
    { label: "Nombre", value: user.nombre },
    { label: "Código", value: user.codigo },
    { label: "Correo", value: user.correo },
    { label: "Carrera", value: user.carrera },
    { label: "Semestre", value: `${user.semestre}` },
    { label: "Materias inscritas", value: `${enrolled.length}` },
    { label: "Créditos", value: `${totalCredits} / 21` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8 max-w-lg">
        <div className="mb-6 animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="h-7 w-7 text-primary" />
            Mi Perfil
          </h1>
        </div>

        <Card className="glass-card animate-fade-in" style={{ animationDelay: "100ms" }}>
          <CardHeader>
            <CardTitle className="font-display">Datos Personales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((f) => (
              <div key={f.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{f.label}</span>
                <span className="text-sm font-medium text-foreground">{f.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="mt-6 space-y-3 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <Button variant="outline" className="w-full gap-2" onClick={restartTutorial}>
            <RefreshCw className="h-4 w-4" />
            Repetir Tutorial
          </Button>
          <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </main>
    </div>
  );
}
