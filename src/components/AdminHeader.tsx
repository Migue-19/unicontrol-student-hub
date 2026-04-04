import { useAuth } from "@/hooks/useAuth";
import { LogOut, Menu, X, Shield } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { label: "Solicitudes", path: "/admin" },
  { label: "Estudiantes", path: "/admin/estudiantes" },
  { label: "Mensajes", path: "/admin/mensajes" },
];

export default function AdminHeader() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/admin")}>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="hidden sm:block">
            <span className="font-display text-lg font-bold text-foreground">UniControl</span>
            <span className="text-xs text-muted-foreground block -mt-1">Panel Administrativo</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="ml-2 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="h-4 w-4" /> Salir
          </button>
        </nav>

        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-card animate-fade-in">
          <div className="container py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMenuOpen(false); }}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 text-left flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
