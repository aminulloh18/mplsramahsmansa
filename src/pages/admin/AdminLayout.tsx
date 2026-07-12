import React, { useState } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  Users,
  Grid,
  Volume2,
  HelpCircle,
  Settings,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Heart,
} from 'lucide-react';
import { UserSession } from '../../services/authService';

interface AdminLayoutProps {
  session: UserSession;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export default function AdminLayout({
  session,
  onLogout,
  activeTab,
  onTabChange,
  children,
}: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Sidebar Menu Items Definition
  const menuItems = session.role === 'Binkel'
    ? [
        { id: 'binkel-dashboard', label: 'Presensi & Kebugaran', icon: Users }
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'siswa', label: 'Data Siswa Baru', icon: Users },
        { id: 'kelas', label: 'Alokasi Kelas', icon: Grid },
        { id: 'wali-kelas', label: 'Guru Wali Kelas', icon: GraduationCap },
        { id: 'analisis-kebugaran', label: 'Analisis Kebugaran', icon: Heart },
        { id: 'pengumuman', label: 'Rilis Pengumuman', icon: Volume2 },
        { id: 'faq', label: 'Manajemen FAQ', icon: HelpCircle },
        { id: 'pengaturan', label: 'Pengaturan Web', icon: Settings },
        { id: 'logs', label: 'Audit Log Keamanan', icon: ShieldCheck },
        { id: 'profile', label: 'Profil Sesi', icon: UserCheck },
      ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex relative selection:bg-blue-600 selection:text-white font-sans">
      
      {/* BACKGROUND DECORATIVE GLOW */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* COLLAPSIBLE SIDEBAR */}
      <aside
        className={`bg-[#0F172A] border-r border-slate-900 transition-all duration-300 flex flex-col justify-between shrink-0 relative z-10 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-950 flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow ${
                  session.role === 'Binkel' ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-blue-600 shadow-blue-500/20'
                }`}>
                  <Sparkles className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <span className="font-black text-sm tracking-wider block text-white">SMAN 1 BDG</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Portal MPLS</span>
                </div>
              </div>
            )}
            
            {collapsed && (
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto shadow ${
                session.role === 'Binkel' ? 'bg-emerald-600' : 'bg-blue-600'
              }`}>
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
            )}

            {/* Collapse Trigger Button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 hover:bg-slate-950 border border-slate-900 rounded-lg text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                    isActive
                      ? session.role === 'Binkel'
                        ? 'bg-emerald-600 text-white shadow shadow-emerald-500/10'
                        : 'bg-blue-600 text-white shadow shadow-blue-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-950">
          {!collapsed ? (
            <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl mb-3">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block mb-1">
                {session.role === 'Binkel' ? 'BINKEL SESSION' : 'OPERATOR PANEL'}
              </span>
              <span className="text-[11px] font-bold text-slate-300 block truncate">
                {session.role === 'Binkel' ? session.binkelName : session.email}
              </span>
            </div>
          ) : null}

          <button
            onClick={onLogout}
            className={`w-full py-2 px-3 hover:bg-rose-500/10 hover:text-rose-400 text-slate-500 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer justify-center md:justify-start`}
            title="Keluar Sesi"
          >
            <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
            {!collapsed && <span>Keluar Panel</span>}
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT BODY */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        
        {/* TOP COMPONENT HEADER */}
        <header className="p-6 border-b border-slate-950 flex items-center justify-between bg-[#020617]/40 backdrop-blur-md">
          <h1 className="text-sm font-black uppercase tracking-widest text-slate-400">
            {menuItems.find((m) => m.id === activeTab)?.label || 'PORTAL MPLS'}
          </h1>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-200">
                {session.role === 'Binkel' ? session.binkelName : session.email}
              </span>
              <span className="text-[9px] text-slate-500">
                {session.role === 'Binkel' ? `Pendamping Kelas ${session.className}` : 'Full Access Privileges'}
              </span>
            </div>
            
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border ${
              session.role === 'Binkel' 
                ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-blue-600/10 text-blue-400 border-blue-500/20'
            }`}>
              {(session.role === 'Binkel' ? session.binkelName : session.email)!.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* CONTAINER SPACE */}
        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
