import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Compass,
  Radio,
  Search,
  LogOut,
  Menu,
  X,
  User,
  Shield,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface AppLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/contratos', icon: FileText, label: 'Contratos' },
  { path: '/sentidos', icon: Compass, label: 'Sentidos' },
  { path: '/equipamentos', icon: Radio, label: 'Equipamentos' },
  { path: '/consultas', icon: Search, label: 'Consultas' },
];

const roleLabels = {
  admin: 'Administrador',
  operador: 'Operador',
  consulta: 'Consulta',
};

const roleColors = {
  admin: 'bg-gradient-to-r from-destructive/20 to-warning/20 text-destructive border-destructive/30',
  operador: 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30',
  consulta: 'bg-muted text-muted-foreground border-muted-foreground/20',
};

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar h-16 flex items-center justify-between px-4 shadow-2xl border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
            <Radio className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-sidebar-foreground">Radares</span>
            <Sparkles className="inline-block w-3 h-3 ml-1 text-warning animate-pulse-soft" />
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-sidebar-foreground hover:bg-sidebar-accent rounded-xl"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-72 bg-sidebar transition-all duration-300 ease-out lg:translate-x-0 shadow-2xl',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-primary/20 to-accent/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-accent/20 to-primary/10 rounded-full blur-3xl" />
          </div>

          {/* Logo */}
          <div className="relative h-20 flex items-center gap-4 px-6 border-b border-sidebar-border/50">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-glow animate-pulse-soft">
              <Radio className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl text-sidebar-foreground">Sistema Radares</span>
              </div>
              <p className="text-xs text-sidebar-foreground/50">Gestão de Implantação</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="relative flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin">
            <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-3 mb-4">
              Menu Principal
            </p>
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 group',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-foreground'
                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300',
                    isActive 
                      ? 'bg-sidebar-foreground/10' 
                      : 'bg-sidebar-accent/50 group-hover:bg-sidebar-accent'
                  )}>
                    <item.icon className={cn(
                      "h-5 w-5 transition-all duration-300",
                      isActive ? "text-sidebar-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground",
                      !isActive && "group-hover:scale-110"
                    )} />
                  </div>
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 opacity-70" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="relative p-4 border-t border-sidebar-border/50 bg-gradient-to-t from-sidebar-accent/30 to-transparent">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-sidebar-foreground truncate">
                    {user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-sidebar-foreground/50 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              {role && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-sidebar-foreground/50" />
                  <Badge variant="outline" className={cn('text-xs border font-medium', roleColors[role])}>
                    {roleLabels[role]}
                  </Badge>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-xl"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair do Sistema
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
