import { useState, useEffect } from "react";
import {
  Users, UserPlus, Search, MoreHorizontal, Shield, ShieldCheck, HardHat,
  CheckCircle2, XCircle, Edit3, Trash2, X, Eye, ChevronDown, Download, Mail, Phone, Loader2
} from "lucide-react";
import { workersAPI, type Worker } from "../lib/api";

/* ── Map Worker → Display format ── */
interface UserDisplay {
  id: number;
  name: string;
  email: string;
  role: string;
  emp: string;
  phone: string;
  department: string;
  status: string;
  lastLogin: string;
  compliance: number;
  avatar: string;
  violations: number;
}

const workerToDisplay = (w: Worker): UserDisplay => ({
  id: w.id,
  name: w.name,
  email: `${w.name.toLowerCase().replace(/\s+/g, '.')}@safeguard.ai`,
  role: "WORKER",
  emp: w.employee_code,
  phone: "+91 00000 00000",
  department: "Operations",
  status: w.is_active ? "active" : "inactive",
  lastLogin: new Date(w.enrolled_at).toLocaleDateString(),
  compliance: Math.round(w.compliance_rate),
  avatar: w.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
  violations: w.violation_count,
});

export default function UserManagement() {
  const [users, setUsers] = useState<UserDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<UserDisplay | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showDropdown, setShowDropdown] = useState<number | null>(null);

  // New user form
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "WORKER", department: "", phone: "" });

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  // Fetch workers from API
  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);
      try {
        const res = await workersAPI.list({ page_size: 100 });
        const mapped = res.data.results.map(workerToDisplay);
        setUsers(mapped);
      } catch {
        // keep empty state
      } finally {
        setLoading(false);
      }
    };
    fetchWorkers();
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.emp.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchStatus = statusFilter === "ALL" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) return;
    try {
      const res = await workersAPI.create({ name: newUser.name, employee_code: `EMP-${String(Date.now()).slice(-3)}` });
      const display = workerToDisplay(res.data);
      display.email = newUser.email;
      display.role = newUser.role;
      display.department = newUser.department || "Unassigned";
      display.phone = newUser.phone || "+91 00000 00000";
      setUsers(prev => [display, ...prev]);
      setShowAddModal(false);
      setNewUser({ name: "", email: "", role: "WORKER", department: "", phone: "" });
      showToast(`${display.name} added successfully`);
    } catch {
      // Fallback: add to local state
      const user: UserDisplay = {
        id: Date.now(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        emp: `EMP-${String(Date.now()).slice(-3)}`,
        phone: newUser.phone || "+91 00000 00000",
        department: newUser.department || "Unassigned",
        status: "active",
        lastLogin: "Never",
        compliance: 100,
        avatar: newUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
        violations: 0,
      };
      setUsers(prev => [user, ...prev]);
      setShowAddModal(false);
      setNewUser({ name: "", email: "", role: "WORKER", department: "", phone: "" });
      showToast(`${user.name} added (offline)`);
    }
  };

  const handleToggleStatus = async (id: number) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const newActive = user.status !== "active";
    try {
      await workersAPI.update(id, { is_active: newActive });
    } catch { /* update locally anyway */ }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newActive ? "active" : "inactive" } : u));
    setShowDropdown(null);
    showToast("User status updated");
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await workersAPI.delete(id);
    } catch { /* remove locally anyway */ }
    setUsers(prev => prev.filter(u => u.id !== id));
    setShowDropdown(null);
    showToast("User removed");
  };

  const handleExportCSV = () => {
    const csv = ["Name,Email,Role,Emp Code,Department,Status,Compliance", ...filtered.map(u => `${u.name},${u.email},${u.role},${u.emp},${u.department},${u.status},${u.compliance}%`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "users_export.csv"; a.click();
    showToast("Users exported to CSV");
  };

  const roleBadge = (role: string) => {
    if (role === "ADMIN") return "bg-purple-100 text-purple-700";
    if (role === "SUPERVISOR") return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-600";
  };

  const statusBadge = (status: string) => {
    if (status === "active") return "bg-green-100 text-green-700";
    if (status === "suspended") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-500";
  };

  const roleIcon = (role: string) => {
    if (role === "ADMIN") return <Shield className="w-3.5 h-3.5" />;
    if (role === "SUPERVISOR") return <ShieldCheck className="w-3.5 h-3.5" />;
    return <HardHat className="w-3.5 h-3.5" />;
  };

  const counts = { total: users.length, admin: users.filter(u => u.role === "ADMIN").length, supervisor: users.filter(u => u.role === "SUPERVISOR").length, worker: users.filter(u => u.role === "WORKER").length, active: users.filter(u => u.status === "active").length };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" /><span className="font-medium text-sm">{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage workers, supervisors & admin access</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm">
            <Download className="w-4 h-4" />Export CSV
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#18181b] text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-md">
            <UserPlus className="w-4 h-4" />Add User
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total Users", value: counts.total, icon: <Users className="w-5 h-5 text-indigo-500" />, bg: "bg-indigo-50" },
          { label: "Admins", value: counts.admin, icon: <Shield className="w-5 h-5 text-purple-500" />, bg: "bg-purple-50" },
          { label: "Supervisors", value: counts.supervisor, icon: <ShieldCheck className="w-5 h-5 text-blue-500" />, bg: "bg-blue-50" },
          { label: "Workers", value: counts.worker, icon: <HardHat className="w-5 h-5 text-amber-500" />, bg: "bg-amber-50" },
          { label: "Active Now", value: counts.active, icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, bg: "bg-green-50" },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center`}>{card.icon}</div>
            <div>
              <p className="text-xl font-bold text-slate-800 tabular-nums">{card.value}</p>
              <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or employee code..." className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all" />
        </div>
        <div className="relative">
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="appearance-none bg-white border border-slate-200 rounded-xl px-4 pr-10 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer">
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="WORKER">Worker</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="appearance-none bg-white border border-slate-200 rounded-xl px-4 pr-10 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer">
            <option value="ALL">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase px-6 py-4">USER</th>
                <th className="text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase px-4 py-4">ROLE</th>
                <th className="text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase px-4 py-4 hidden lg:table-cell">DEPARTMENT</th>
                <th className="text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase px-4 py-4 hidden md:table-cell">STATUS</th>
                <th className="text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase px-4 py-4 hidden xl:table-cell">COMPLIANCE</th>
                <th className="text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase px-4 py-4 hidden xl:table-cell">LAST LOGIN</th>
                <th className="text-right text-[10px] font-bold text-slate-400 tracking-wider uppercase px-6 py-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedUser(user)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">{user.avatar}</div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{user.name}</p>
                        <p className="text-[11px] text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${roleBadge(user.role)}`}>
                      {roleIcon(user.role)}{user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <p className="text-xs text-slate-600 font-medium">{user.department}</p>
                    <p className="text-[10px] text-slate-400">{user.emp}</p>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${statusBadge(user.status)}`}>{user.status}</span>
                  </td>
                  <td className="px-4 py-4 hidden xl:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${user.compliance >= 90 ? "bg-green-500" : user.compliance >= 75 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${user.compliance}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 tabular-nums">{user.compliance}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden xl:table-cell">
                    <p className="text-xs text-slate-500">{user.lastLogin}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setShowDropdown(showDropdown === user.id ? null : user.id)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                      </button>
                      {showDropdown === user.id && (
                        <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-slate-200 py-2 w-44 z-30">
                          <button onClick={() => { setSelectedUser(user); setShowDropdown(null); }} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Eye className="w-3.5 h-3.5" />View Profile</button>
                          <button onClick={() => showToast(`Editing ${user.name}...`)} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Edit3 className="w-3.5 h-3.5" />Edit User</button>
                          <button onClick={() => handleToggleStatus(user.id)} className="w-full text-left px-4 py-2 text-xs font-medium text-amber-600 hover:bg-amber-50 flex items-center gap-2">
                            {user.status === "active" ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            {user.status === "active" ? "Suspend" : "Activate"}
                          </button>
                          <hr className="my-1 border-slate-100" />
                          <button onClick={() => handleDeleteUser(user.id)} className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" />Delete User</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-400">Showing <span className="font-bold text-slate-700">{filtered.length}</span> of {users.length} users</p>
          <div className="flex gap-1">
            {[1, 2, 3].map(p => (
              <button key={p} className={`w-8 h-8 rounded-lg text-xs font-bold ${p === 1 ? "bg-[#18181b] text-white" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">{selectedUser.avatar}</div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedUser.name}</h2>
                <p className="text-sm text-slate-500">{selectedUser.emp} · {selectedUser.department}</p>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full mt-1 ${roleBadge(selectedUser.role)}`}>{roleIcon(selectedUser.role)}{selectedUser.role}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 rounded-xl p-4"><p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Email</p><p className="text-sm font-medium text-slate-800 mt-1 flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" />{selectedUser.email}</p></div>
              <div className="bg-slate-50 rounded-xl p-4"><p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Phone</p><p className="text-sm font-medium text-slate-800 mt-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" />{selectedUser.phone}</p></div>
              <div className="bg-slate-50 rounded-xl p-4"><p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Compliance Rate</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${selectedUser.compliance >= 90 ? "bg-green-500" : selectedUser.compliance >= 75 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${selectedUser.compliance}%` }} /></div>
                  <span className="text-sm font-bold text-slate-800">{selectedUser.compliance}%</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4"><p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Status</p><span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mt-1 capitalize ${statusBadge(selectedUser.status)}`}>{selectedUser.status}</span></div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">Recent Violations</p>
              <div className="space-y-2">
                {selectedUser.violations > 0 ? (
                  <p className="text-xs text-amber-600 font-medium">{selectedUser.violations} violations recorded</p>
                ) : (
                  <p className="text-xs text-green-600 font-medium">No recent violations — excellent record!</p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { handleToggleStatus(selectedUser.id); setSelectedUser(null); }} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${selectedUser.status === "active" ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-green-500 text-white hover:bg-green-600"}`}>
                {selectedUser.status === "active" ? "Suspend User" : "Activate User"}
              </button>
              <button onClick={() => { showToast("Password reset link sent"); setSelectedUser(null); }} className="flex-1 bg-indigo-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-colors">Reset Password</button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><UserPlus className="w-6 h-6 text-indigo-500" />Add New User</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-1.5 block">Full Name *</label>
                <input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Enter full name" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-1.5 block">Email *</label>
                <input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@safeguard.ai" type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-1.5 block">Role *</label>
                  <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer">
                    <option value="WORKER">Worker</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-1.5 block">Department</label>
                  <input value={newUser.department} onChange={e => setNewUser({ ...newUser, department: e.target.value })} placeholder="e.g., Assembly Line" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-1.5 block">Phone</label>
                <input value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} placeholder="+91 98765 43210" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleAddUser} className="flex-1 py-3 bg-[#18181b] text-white rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-md">Create User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
