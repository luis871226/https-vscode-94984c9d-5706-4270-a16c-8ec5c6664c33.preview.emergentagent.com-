import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Train, Cpu, Volume2, Euro, Plus, TrendingUp, TrainTrack } from "lucide-react";
import { getStats, getLocomotives } from "../lib/api";
import { Button } from "../components/ui/button";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentLocomotives, setRecentLocomotives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, locomotivesRes] = await Promise.all([
          getStats(),
          getLocomotives()
        ]);
        setStats(statsRes.data);
        // Get 5 most recent locomotives
        const sorted = locomotivesRes.data.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        setRecentLocomotives(sorted.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card">
              <div className="skeleton h-12 w-24 mb-2"></div>
              <div className="skeleton h-4 w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      value: stats?.total_locomotives || 0,
      label: "Locomotoras",
      icon: Train,
      color: "text-red-600",
      bgColor: "bg-red-50",
      link: "/locomotives"
    },
    {
      value: stats?.total_rolling_stock || 0,
      label: "Vagones/Coches",
      icon: TrainTrack,
      color: "text-green-600",
      bgColor: "bg-green-50",
      link: "/rolling-stock"
    },
    {
      value: stats?.total_decoders || 0,
      label: "Decodificadores",
      icon: Cpu,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      link: "/decoders"
    },
    {
      value: stats?.total_value?.toFixed(2) || "0.00",
      label: "Valor Total",
      icon: Euro,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      prefix: "€"
    }
  ];

  return (
    <div className="animate-fade-in" data-testid="dashboard">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold uppercase tracking-tight text-slate-900">
          Dashboard
        </h1>
        <p className="font-mono text-sm text-slate-500 mt-1 uppercase tracking-wider">
          Resumen de tu colección
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="stat-card group"
            data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-value">
                  {stat.prefix && <span className="text-2xl mr-1">{stat.prefix}</span>}
                  {stat.value}
                </p>
                <p className="stat-label">{stat.label}</p>
              </div>
              <div className={`p-3 ${stat.bgColor} transition-transform group-hover:scale-110`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            {stat.link && (
              <Link 
                to={stat.link}
                className="font-mono text-xs text-slate-400 hover:text-red-600 mt-4 inline-block uppercase tracking-wider"
              >
                Ver todos →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 p-6">
            <h2 className="font-heading text-lg font-semibold uppercase tracking-tight text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-red-600" />
              Acciones Rápidas
            </h2>
            <div className="space-y-3">
              <Link to="/locomotives/new" className="block">
                <Button 
                  className="w-full justify-start gap-3 bg-red-600 hover:bg-red-700 text-white font-mono uppercase tracking-widest text-xs"
                  data-testid="add-locomotive-btn"
                >
                  <Train className="w-4 h-4" />
                  Nueva Locomotora
                </Button>
              </Link>
              <Link to="/rolling-stock/new" className="block">
                <Button 
                  variant="outline"
                  className="w-full justify-start gap-3 font-mono uppercase tracking-widest text-xs border-slate-300"
                  data-testid="add-rolling-stock-btn"
                >
                  <TrainTrack className="w-4 h-4" />
                  Nuevo Vagón/Coche
                </Button>
              </Link>
              <Link to="/decoders/new" className="block">
                <Button 
                  variant="outline"
                  className="w-full justify-start gap-3 font-mono uppercase tracking-widest text-xs border-slate-300"
                  data-testid="add-decoder-btn"
                >
                  <Cpu className="w-4 h-4" />
                  Nuevo Decodificador
                </Button>
              </Link>
              <Link to="/sound-projects/new" className="block">
                <Button 
                  variant="outline"
                  className="w-full justify-start gap-3 font-mono uppercase tracking-widest text-xs border-slate-300"
                  data-testid="add-sound-project-btn"
                >
                  <Volume2 className="w-4 h-4" />
                  Nuevo Proyecto Sonido
                </Button>
              </Link>
            </div>
          </div>

          {/* Distribution by Brand */}
          {stats?.locomotives_by_brand && Object.keys(stats.locomotives_by_brand).length > 0 && (
            <div className="bg-white border border-slate-200 p-6 mt-6">
              <h2 className="font-heading text-lg font-semibold uppercase tracking-tight text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Por Marca
              </h2>
              <div className="space-y-3">
                {Object.entries(stats.locomotives_by_brand).map(([brand, count]) => (
                  <div key={brand} className="flex items-center justify-between">
                    <span className="font-mono text-sm text-slate-700">{brand}</span>
                    <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2 py-1">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Locomotives */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="font-heading text-lg font-semibold uppercase tracking-tight text-slate-800 flex items-center gap-2">
                <Train className="w-5 h-5 text-red-600" />
                Últimas Locomotoras Añadidas
              </h2>
            </div>
            
            {recentLocomotives.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full railway-table">
                  <thead>
                    <tr>
                      <th className="text-left">Marca/Modelo</th>
                      <th className="text-left">Referencia</th>
                      <th className="text-center">DCC</th>
                      <th className="text-left">Decodificador</th>
                      <th className="text-left">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLocomotives.map((loco) => (
                      <tr 
                        key={loco.id} 
                        className="data-row"
                        data-testid={`recent-loco-${loco.id}`}
                      >
                        <td>
                          <Link 
                            to={`/locomotives/${loco.id}`}
                            className="text-slate-900 hover:text-red-600"
                          >
                            <span className="font-semibold">{loco.brand}</span>
                            <br />
                            <span className="text-slate-500 text-xs">{loco.model}</span>
                          </Link>
                        </td>
                        <td className="text-slate-600">{loco.reference}</td>
                        <td className="text-center">
                          <span className="bg-slate-100 px-2 py-1 text-xs">
                            {loco.dcc_address}
                          </span>
                        </td>
                        <td className="text-slate-600">
                          {loco.decoder_brand && loco.decoder_model 
                            ? `${loco.decoder_brand} ${loco.decoder_model}`
                            : "-"
                          }
                        </td>
                        <td>
                          <span className="flex items-center">
                            <span className={`status-indicator status-${loco.condition}`}></span>
                            <span className="capitalize">{loco.condition}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <Train className="w-16 h-16 mx-auto empty-state-icon" />
                <p className="empty-state-text">No hay locomotoras en la colección</p>
                <Link to="/locomotives/new">
                  <Button className="mt-4 bg-red-600 hover:bg-red-700 font-mono uppercase tracking-widest text-xs">
                    Añadir Primera Locomotora
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Distribution by Company */}
          {stats?.locomotives_by_company && Object.keys(stats.locomotives_by_company).length > 0 && (
            <div className="bg-white border border-slate-200 p-6 mt-6">
              <h2 className="font-heading text-lg font-semibold uppercase tracking-tight text-slate-800 mb-4">
                Por Compañía Ferroviaria
              </h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.locomotives_by_company).map(([company, count]) => (
                  <span 
                    key={company} 
                    className="badge badge-company"
                  >
                    {company}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
