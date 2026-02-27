import { useState, useEffect } from "react";
import {
  Trophy, Star, Flame, Shield, Zap, Target, Award, Crown,
  ChevronUp, TrendingUp, Medal, Gift
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { analyticsAPI, type LeaderboardEntry } from "../lib/api";

/* ── Worker display type ── */
interface GamWorker {
  rank: number; name: string; id: string; dept: string; avatar: string;
  xp: number; level: number; compliance: number; streak: number;
  badges: number; tier: string; change: number;
}

/* ── Fallback demo workers with gamification data ── */
const FALLBACK_WORKERS: GamWorker[] = [
  { rank: 1, name: "Priya Nair", id: "EMP-005", dept: "Processing", avatar: "PN", xp: 4850, level: 12, compliance: 100, streak: 60, badges: 6, tier: "Diamond", change: 0 },
  { rank: 2, name: "Lakshmi Devi", id: "EMP-008", dept: "Safety", avatar: "LD", xp: 4620, level: 11, compliance: 99, streak: 90, badges: 6, tier: "Diamond", change: 0 },
  { rank: 3, name: "Deepak Yadav", id: "EMP-003", dept: "Processing", avatar: "DY", xp: 4310, level: 11, compliance: 98, streak: 45, badges: 5, tier: "Platinum", change: 1 },
  { rank: 4, name: "Rajesh Kumar", id: "EMP-001", dept: "Mining Ops", avatar: "RK", xp: 3890, level: 10, compliance: 96, streak: 24, badges: 5, tier: "Platinum", change: -1 },
  { rank: 5, name: "Naveen Reddy", id: "EMP-014", dept: "Loading", avatar: "NR", xp: 3650, level: 9, compliance: 94, streak: 21, badges: 4, tier: "Gold", change: 2 },
  { rank: 6, name: "Suresh Reddy", id: "EMP-002", dept: "Excavation", avatar: "SR", xp: 3420, level: 9, compliance: 92, streak: 18, badges: 4, tier: "Gold", change: 0 },
  { rank: 7, name: "Mohammed Ismail", id: "EMP-010", dept: "Conveyor Ops", avatar: "MI", xp: 3180, level: 8, compliance: 91, streak: 12, badges: 3, tier: "Gold", change: -2 },
  { rank: 8, name: "Amit Singh", id: "EMP-004", dept: "Blasting", avatar: "AS", xp: 2750, level: 7, compliance: 88, streak: 7, badges: 3, tier: "Silver", change: 1 },
  { rank: 9, name: "Sandeep Joshi", id: "EMP-011", dept: "Mining Ops", avatar: "SJ", xp: 2310, level: 6, compliance: 85, streak: 3, badges: 2, tier: "Silver", change: -1 },
  { rank: 10, name: "Vikram Singh", id: "EMP-089", dept: "Excavation", avatar: "VS", xp: 1850, level: 5, compliance: 79, streak: 1, badges: 1, tier: "Bronze", change: 0 },
];

/** Map API leaderboard entries to display format */
function mapLeaderboardEntry(e: LeaderboardEntry): GamWorker {
  const score = e.safety_score;
  const tier = score >= 90 ? "Diamond" : score >= 80 ? "Platinum" : score >= 70 ? "Gold" : score >= 55 ? "Silver" : "Bronze";
  const level = Math.max(1, Math.floor(score / 8));
  const xp = Math.round(score * 50);
  const initials = e.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
  return {
    rank: e.rank,
    name: e.name,
    id: e.employee_code,
    dept: "Operations",
    avatar: initials,
    xp,
    level,
    compliance: Math.round(score),
    streak: e.streak_days,
    badges: e.badges.length,
    tier,
    change: 0,
  };
}

/* ── Achievement badges ── */
const BADGES = [
  { name: "Safety Rookie", icon: "🛡️", desc: "Completed first PPE check", rarity: "Common", color: "from-slate-100 to-slate-200", xp: 50 },
  { name: "Iron Streak", icon: "🔥", desc: "7 consecutive clean days", rarity: "Uncommon", color: "from-orange-100 to-amber-200", xp: 150 },
  { name: "Zone Master", icon: "⭐", desc: "Top compliance in your zone", rarity: "Rare", color: "from-blue-100 to-indigo-200", xp: 300 },
  { name: "Perfect Month", icon: "🏆", desc: "30 days zero violations", rarity: "Epic", color: "from-purple-100 to-violet-200", xp: 500 },
  { name: "Quick Responder", icon: "⚡", desc: "Avg response under 5 min", rarity: "Rare", color: "from-yellow-100 to-amber-200", xp: 250 },
  { name: "Veteran Guard", icon: "🎖️", desc: "1+ year safe record", rarity: "Legendary", color: "from-amber-100 to-yellow-200", xp: 1000 },
  { name: "Team Shield", icon: "🤝", desc: "Helped 5 teammates with PPE", rarity: "Uncommon", color: "from-emerald-100 to-green-200", xp: 200 },
  { name: "Night Owl", icon: "🦉", desc: "10 clean night shifts", rarity: "Rare", color: "from-indigo-100 to-blue-200", xp: 300 },
  { name: "Diamond Safety", icon: "💎", desc: "Reached Diamond tier", rarity: "Legendary", color: "from-cyan-100 to-blue-200", xp: 2000 },
];

const tierConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  Diamond: { color: "text-cyan-600", bg: "bg-gradient-to-r from-cyan-50 to-blue-50", icon: <Crown className="w-4 h-4 text-cyan-500" /> },
  Platinum: { color: "text-violet-600", bg: "bg-gradient-to-r from-violet-50 to-purple-50", icon: <Star className="w-4 h-4 text-violet-500" /> },
  Gold: { color: "text-amber-600", bg: "bg-gradient-to-r from-amber-50 to-yellow-50", icon: <Medal className="w-4 h-4 text-amber-500" /> },
  Silver: { color: "text-slate-500", bg: "bg-gradient-to-r from-slate-50 to-slate-100", icon: <Shield className="w-4 h-4 text-slate-400" /> },
  Bronze: { color: "text-orange-700", bg: "bg-gradient-to-r from-orange-50 to-amber-50", icon: <Target className="w-4 h-4 text-orange-600" /> },
};

const rarityColors: Record<string, string> = {
  Common: "bg-slate-100 text-slate-600",
  Uncommon: "bg-green-100 text-green-700",
  Rare: "bg-blue-100 text-blue-700",
  Epic: "bg-purple-100 text-purple-700",
  Legendary: "bg-amber-100 text-amber-700",
};

/* ── Weekly XP chart data (derived from workers in component) ── */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const barColors = ["#818cf8", "#6366f1", "#a78bfa", "#6366f1", "#818cf8", "#c4b5fd", "#ddd6fe"];

const DarkTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a2e] text-white px-3 py-2 rounded-lg shadow-xl text-xs border border-slate-700">
      <p className="text-slate-400 text-[10px]">{label}</p>
      <p className="font-bold text-indigo-300">{payload[0].value} XP</p>
    </div>
  );
};

export default function Gamification() {
  const [showBadgePopup, _setShowBadgePopup] = useState<typeof BADGES[0] | null>(null);
  const [confetti, _setConfetti] = useState(false);
  const [workers, setWorkers] = useState<GamWorker[]>(FALLBACK_WORKERS);

  // Fetch leaderboard from API
  useEffect(() => {
    (async () => {
      try {
        const res = await analyticsAPI.leaderboard({ days: 30, limit: 15 });
        const entries = res.data.leaderboard;
        if (entries.length > 0) {
          setWorkers(entries.map(mapLeaderboardEntry));
        }
      } catch {
        // keep fallback
      }
    })();
  }, []);


  const stats = {
    totalXP: workers.reduce((a, w) => a + w.xp, 0),
    avgLevel: workers.length > 0 ? (workers.reduce((a, w) => a + w.level, 0) / workers.length).toFixed(1) : "0",
    totalBadges: workers.reduce((a, w) => a + w.badges, 0),
    topStreak: workers.length > 0 ? Math.max(...workers.map(w => w.streak)) : 0,
  };

  // Derive weekly XP distribution from worker data (simulated daily earning curve)
  const totalWeekXP = stats.totalXP;
  const weeklyDistribution = [0.14, 0.19, 0.11, 0.22, 0.17, 0.10, 0.07]; // weightings per day
  const weeklyXP = DAYS.map((day, i) => ({
    day,
    xp: Math.round(totalWeekXP * weeklyDistribution[i] / Math.max(workers.length, 1)),
  }));

  return (
    <div className="space-y-6 font-sans relative">
      {/* Confetti overlay */}
      {confetti && (
        <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
          {Array.from({ length: 60 }, (_, i) => (
            <div key={i} className="absolute animate-bounce" style={{
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              fontSize: `${12 + Math.random() * 16}px`,
            }}>
              {["🎉", "⭐", "🏆", "✨", "🔥", "💎"][i % 6]}
            </div>
          ))}
        </div>
      )}

      {/* Badge Popup */}
      {showBadgePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 shadow-2xl text-center max-w-sm animate-in zoom-in-95 border-2 border-amber-200">
            <div className="text-6xl mb-4">{showBadgePopup.icon}</div>
            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mb-1">Achievement Unlocked!</p>
            <h2 className="text-2xl font-black text-slate-800 mb-1">{showBadgePopup.name}</h2>
            <p className="text-sm text-slate-500 mb-3">{showBadgePopup.desc}</p>
            <div className="flex items-center justify-center gap-2">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${rarityColors[showBadgePopup.rarity]}`}>{showBadgePopup.rarity}</span>
              <span className="text-xs font-bold text-indigo-600">+{showBadgePopup.xp} XP</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-500" />Gamification & Achievements</h1>
        <p className="text-sm text-slate-500 mt-1">Worker safety XP, leaderboards, and achievement badges</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total XP Earned", value: stats.totalXP.toLocaleString(), icon: <Zap className="w-5 h-5 text-indigo-500" />, color: "text-indigo-600" },
          { label: "Avg Level", value: stats.avgLevel, icon: <TrendingUp className="w-5 h-5 text-emerald-500" />, color: "text-emerald-600" },
          { label: "Badges Awarded", value: stats.totalBadges, icon: <Award className="w-5 h-5 text-amber-500" />, color: "text-amber-600" },
          { label: "Top Streak", value: `${stats.topStreak}d`, icon: <Flame className="w-5 h-5 text-orange-500" />, color: "text-orange-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">{s.icon}</div>
            <div>
              <p className={`text-2xl font-bold ${s.color} tabular-nums`}>{s.value}</p>
              <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4"><Crown className="w-4 h-4 text-amber-500" />XP Leaderboard</h2>
          <div className="space-y-2">
            {workers.map(w => {
              const tier = tierConfig[w.tier];
              const progress = ((w.xp % 500) / ((w.level + 1) * 500)) * 100;
              return (
                <div key={w.id} className={`flex items-center gap-3 p-3 rounded-xl ${w.rank <= 3 ? tier.bg : "hover:bg-slate-50"} transition-all border border-transparent hover:border-slate-200`}>
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${w.rank === 1 ? "bg-amber-400 text-white" : w.rank === 2 ? "bg-slate-300 text-white" : w.rank === 3 ? "bg-orange-400 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {w.rank}
                  </div>
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">{w.avatar}</div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700 truncate">{w.name}</span>
                      {tier.icon}
                      <span className={`text-[9px] font-bold ${tier.color}`}>{w.tier}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono">{w.id}</span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="text-[10px] text-slate-400">Lv.{w.level}</span>
                      <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                  {/* XP */}
                  <div className="text-right">
                    <p className="text-sm font-bold text-indigo-600 tabular-nums">{w.xp.toLocaleString()} XP</p>
                    <div className="flex items-center gap-1 justify-end">
                      <Flame className="w-3 h-3 text-orange-400" />
                      <span className="text-[10px] text-orange-500 font-bold">{w.streak}d</span>
                      {w.change !== 0 && (
                        <span className={`text-[10px] font-bold flex items-center ${w.change > 0 ? "text-emerald-500" : "text-red-400"}`}>
                          <ChevronUp className={`w-3 h-3 ${w.change < 0 ? "rotate-180" : ""}`} />{Math.abs(w.change)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Weekly XP Chart */}
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4"><Zap className="w-4 h-4 text-indigo-500" />Weekly XP Earned</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyXP}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="xp" radius={[6, 6, 0, 0]} barSize={28}>
                  {weeklyXP.map((_, i) => <Cell key={i} fill={barColors[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Achievements Showcase */}
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4"><Gift className="w-4 h-4 text-amber-500" />All Achievements</h2>
            <div className="grid grid-cols-1 gap-2">
              {BADGES.map(badge => (
                <div key={badge.name} className={`bg-gradient-to-r ${badge.color} rounded-xl p-3 flex items-center gap-3 border border-white/50`}>
                  <span className="text-2xl">{badge.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700">{badge.name}</p>
                    <p className="text-[9px] text-slate-500">{badge.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${rarityColors[badge.rarity]}`}>{badge.rarity}</span>
                    <p className="text-[10px] font-bold text-indigo-600 mt-0.5">+{badge.xp} XP</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tier Breakdown */}
          <div className="bg-gradient-to-r from-[#1a1443] to-[#2c1555] rounded-[2rem] p-5 text-white">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Crown className="w-4 h-4 text-amber-400" />Tier Distribution</h3>
            {Object.entries(tierConfig).map(([tier, config]) => {
              const count = workers.filter(w => w.tier === tier).length;
              return (
                <div key={tier} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <span className="text-xs text-indigo-200/70">{tier}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${workers.length > 0 ? (count / workers.length) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs font-bold text-indigo-300 w-6 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
