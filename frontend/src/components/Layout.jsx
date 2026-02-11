import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Train, LayoutDashboard, Cpu, Volume2, TrainTrack, Database } from "lucide-react";

const Layout = () => {
  const location = useLocation();

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/locomotives", icon: Train, label: "Locomotoras" },
    { to: "/rolling-stock", icon: TrainTrack, label: "Vagones" },
    { to: "/decoders", icon: Cpu, label: "Decodificadores" },
    { to: "/sound-projects", icon: Volume2, label: "Sonido" },
    { to: "/backup", icon: Database, label: "Backup" },
  ];

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink 
              to="/" 
              className="flex items-center gap-3"
              data-testid="logo-link"
            >
              <div className="w-10 h-10 bg-red-600 flex items-center justify-center">
                <Train className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-heading text-xl font-bold uppercase tracking-tight text-slate-900">
                  Railway Collection
                </h1>
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                  Escala N
                </p>
              </div>
            </NavLink>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = 
                  item.to === "/" 
                    ? location.pathname === "/" 
                    : location.pathname.startsWith(item.to);
                
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                    className={`flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all duration-150 border-b-2 ${
                      isActive
                        ? "text-red-600 border-red-600"
                        : "text-slate-600 border-transparent hover:text-red-600 hover:border-red-300"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <p className="font-mono text-xs text-slate-400 text-center uppercase tracking-widest">
            Railway Collection Manager &bull; Escala N &bull; Sistema de Gestión Digital
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
