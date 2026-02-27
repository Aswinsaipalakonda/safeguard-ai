import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Camera, AlertTriangle, FileText, Settings, ShieldAlert, Menu, X, Bell, Flame, Trophy } from "lucide-react";
import useStore from "../store";

const SidebarContent = ({ location, navItems, setIsMobileMenuOpen, handleLogout, role }: any) => (
  <>
    <div className="p-6 flex items-center space-x-3">
      <div className="bg-white p-2 rounded-lg">
         <ShieldAlert className="text-black w-6 h-6" />
      </div>
      <span className="text-xl font-bold tracking-wide text-white">SafeGuard AI</span>
    </div>
    
    <div className="flex-1 px-4 py-4 overflow-y-auto">
      <nav className="space-y-2">
        {navItems.map((item: any) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
                active 
                  ? "bg-[#1e1e1e] text-white font-medium shadow-sm relative" 
                  : "text-slate-400 hover:bg-[#1a1a1a] hover:text-white"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {active && <div className="absolute right-4 w-2 h-2 rounded-full bg-blue-500"></div>}
            </Link>
          );
        })}
      </nav>
    </div>

    <div className="p-4 mt-auto">
       <div className="bg-[#1a1a1a] rounded-2xl p-4 flex flex-col justify-between">
           <div className="flex items-center space-x-3 mb-3">
               <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                  <span className="text-slate-300 font-bold">AS</span>
               </div>
               <div>
                  <p className="text-white text-sm font-medium">{role === 'ADMIN' ? 'Administration' : 'Supervisor'}</p>
                  <p className="text-slate-400 text-xs">Active Session</p>
               </div>
           </div>
           <button 
              onClick={handleLogout}
              className="w-full py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
           >
              <X size={16} /> Logout
           </button>
       </div>
    </div>
  </>
);

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const logout = useStore((state) => state.logout);
  const role = useStore((state) => state.role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: "Dashboard", path: "/monitoring", icon: <Camera size={20} />, roles: ["ADMIN", "SUPERVISOR"] },
    { label: "Violations", path: "/violations", icon: <AlertTriangle size={20} />, roles: ["ADMIN", "SUPERVISOR"] },
    { label: "Heatmap", path: "/heatmap", icon: <Flame size={20} />, roles: ["ADMIN"] },
    { label: "Leaderboard", path: "/leaderboard", icon: <Trophy size={20} />, roles: ["ADMIN", "SUPERVISOR"] },
    { label: "Reports", path: "/reports", icon: <FileText size={20} />, roles: ["ADMIN", "SUPERVISOR"] },
    { label: "Settings", path: "/settings", icon: <Settings size={20} />, roles: ["ADMIN"] },
  ];

  const visibleNavItems = navItems.filter((item) => item.roles.includes(role || "SUPERVISOR"));

  return (
    <div className="flex h-screen bg-[#f4f6f8] text-slate-800 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop & Mobile Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-[#09090b] flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
         <SidebarContent 
            location={location} 
            navItems={visibleNavItems} 
            setIsMobileMenuOpen={setIsMobileMenuOpen} 
            handleLogout={handleLogout} 
            role={role} 
         />
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-white/50 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-4 lg:px-8 z-10">
          <div className="flex items-center">
            <button 
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800 mr-2"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div>
               <h2 className="text-xl font-bold text-slate-800 hidden sm:block">Manufacturing Plant Alpha</h2>
               <p className="text-sm text-slate-500 hidden sm:block">Industrial Zone, Sector 4</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="relative bg-white border border-slate-200 rounded-full px-4 py-2 hidden md:flex items-center shadow-sm">
                <span className="text-sm text-slate-400">Search zones, cameras...</span>
             </div>
             <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                <Bell size={24} />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
          </div>
        </header>

        {/* Dynamic Outlet */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 scroll-smooth will-change-scroll pb-24 lg:pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
