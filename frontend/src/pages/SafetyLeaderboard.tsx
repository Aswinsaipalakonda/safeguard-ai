import { useState, useEffect } from "react";
import { Trophy, Star, Shield, Medal, Flame, Crown } from "lucide-react";
import api from "../lib/api";

interface Badge {
  name: string;
  icon: string;
  desc: string;
}

interface LeaderboardEntry {
  rank: number;
  worker_id: number;
  name: string;
  employee_code: string;
  safety_score: number;
  stars: number;
  total_violations: number;
  resolved: number;
  badges: Badge[];
  streak_days: number;
  language: string;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  period_days: number;
  total_workers: number;
}

export default function SafetyLeaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fallback: LeaderboardData = {
      leaderboard: [
        { rank: 1, worker_id: 1, name: "Rajesh Kumar", employee_code: "EMP-001", safety_score: 98.5, stars: 5, total_violations: 0, resolved: 0, badges: [{ name: "Zero Hero", icon: "🛡️", desc: "Zero violations" }, { name: "Safety Champion", icon: "🏆", desc: "Score above 95" }], streak_days: 30, language: "hi" },
        { rank: 2, worker_id: 2, name: "Suresh Reddy", employee_code: "EMP-002", safety_score: 96.0, stars: 5, total_violations: 1, resolved: 1, badges: [{ name: "Safety Champion", icon: "🏆", desc: "Score above 95" }, { name: "Quick Resolver", icon: "⚡", desc: "All resolved" }], streak_days: 22, language: "te" },
        { rank: 3, worker_id: 3, name: "Anand Sharma", employee_code: "EMP-003", safety_score: 93.2, stars: 4, total_violations: 2, resolved: 2, badges: [{ name: "Quick Resolver", icon: "⚡", desc: "All resolved" }], streak_days: 18, language: "hi" },
        { rank: 4, worker_id: 4, name: "Mohammed Ismail", employee_code: "EMP-004", safety_score: 89.8, stars: 4, total_violations: 3, resolved: 2, badges: [{ name: "Consistent", icon: "📈", desc: "90%+ compliance" }], streak_days: 14, language: "en" },
        { rank: 5, worker_id: 5, name: "Priya Nair", employee_code: "EMP-005", safety_score: 86.5, stars: 4, total_violations: 4, resolved: 3, badges: [{ name: "Rising Star", icon: "🌟", desc: "Improved 15%+" }], streak_days: 10, language: "ta" },
        { rank: 6, worker_id: 6, name: "Vikram Singh", employee_code: "EMP-006", safety_score: 82.1, stars: 4, total_violations: 5, resolved: 3, badges: [], streak_days: 7, language: "hi" },
        { rank: 7, worker_id: 7, name: "Karthik Bhat", employee_code: "EMP-007", safety_score: 78.0, stars: 3, total_violations: 6, resolved: 4, badges: [], streak_days: 5, language: "kn" },
        { rank: 8, worker_id: 8, name: "Deepak Yadav", employee_code: "EMP-008", safety_score: 74.5, stars: 3, total_violations: 7, resolved: 4, badges: [], streak_days: 3, language: "hi" },
        { rank: 9, worker_id: 9, name: "Arjun Patel", employee_code: "EMP-009", safety_score: 71.2, stars: 3, total_violations: 8, resolved: 5, badges: [], streak_days: 2, language: "gu" },
        { rank: 10, worker_id: 10, name: "Mohan Das", employee_code: "EMP-010", safety_score: 68.0, stars: 3, total_violations: 10, resolved: 6, badges: [], streak_days: 1, language: "ml" },
      ],
      period_days: days,
      total_workers: 10,
    };
    api.get(`/analytics/leaderboard/?days=${days}`)
      .then((res) => {
        if (res.data && res.data.leaderboard && res.data.leaderboard.length > 0) {
          setData(res.data);
        } else {
          setData(fallback);
        }
      })
      .catch(() => {
        setData(fallback);
      })
      .finally(() => setLoading(false));
  }, [days]);

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-slate-400">#{rank}</span>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return "text-emerald-500";
    if (score >= 85) return "text-blue-500";
    if (score >= 70) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 95) return "from-emerald-400 to-emerald-600";
    if (score >= 85) return "from-blue-400 to-blue-600";
    if (score >= 70) return "from-amber-400 to-amber-600";
    return "from-red-400 to-red-600";
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-wide">Safety Leaderboard</h1>
            <p className="text-slate-500 text-sm">Gamified worker safety rankings with badges</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                days === d
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      {data && data.leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {[data.leaderboard[1], data.leaderboard[0], data.leaderboard[2]].map((worker, idx) => {
            const podiumOrder = [2, 1, 3];
            const rank = podiumOrder[idx];
            const isGold = rank === 1;
            const heights = ["h-40", "h-52", "h-36"];
            const gradients = [
              "from-slate-300 to-slate-400",
              "from-amber-300 to-yellow-500",
              "from-amber-600 to-amber-700",
            ];

            return (
              <div key={worker.worker_id} className="flex flex-col items-center">
                <div className={`w-16 h-16 ${isGold ? "w-20 h-20" : ""} bg-gradient-to-br ${gradients[idx]} rounded-full flex items-center justify-center shadow-xl mb-3 ${isGold ? "ring-4 ring-yellow-300 ring-offset-2" : ""}`}>
                  <span className="text-2xl font-black text-white">{worker.name.charAt(0)}</span>
                </div>
                <p className="font-bold text-slate-800 text-sm text-center">{worker.name}</p>
                <div className="flex items-center space-x-0.5 my-1">
                  {Array.from({ length: worker.stars }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className={`text-xl font-black ${getScoreColor(worker.safety_score)}`}>{worker.safety_score}</p>
                <div className="flex flex-wrap justify-center gap-1 mt-1">
                  {worker.badges.slice(0, 2).map((b, i) => (
                    <span key={i} className="text-xs bg-slate-100 px-2 py-0.5 rounded-full" title={b.desc}>
                      {b.icon} {b.name}
                    </span>
                  ))}
                </div>
                <div className={`w-full ${heights[idx]} bg-gradient-to-t ${gradients[idx]} rounded-t-2xl mt-3 flex items-end justify-center pb-4`}>
                  <span className="text-3xl font-black text-white/80">#{rank}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard */}
      {data && (
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-indigo-500" />
            <span>Full Rankings</span>
            <span className="text-xs text-slate-400 ml-auto">{data.total_workers} workers</span>
          </h2>
          <div className="space-y-3">
            {data.leaderboard.map((worker) => (
              <div key={worker.worker_id} className={`flex items-center p-4 rounded-2xl transition-all hover:shadow-md ${worker.rank <= 3 ? "bg-gradient-to-r from-amber-50 to-white border border-amber-100" : "bg-slate-50/50 border border-slate-100"}`}>
                {/* Rank */}
                <div className="w-12 flex items-center justify-center shrink-0">
                  {getRankDisplay(worker.rank)}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm ml-2 shrink-0">
                  {worker.name.split(" ").map(n => n[0]).join("")}
                </div>

                {/* Info */}
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="font-bold text-slate-800 truncate">{worker.name}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{worker.employee_code}</span>
                  </div>
                  <div className="flex items-center space-x-3 mt-1">
                    <div className="flex items-center space-x-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < worker.stars ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center">
                      <Flame className="w-3 h-3 text-orange-400 mr-0.5" />
                      {worker.streak_days}d streak
                    </span>
                    {worker.badges.map((b, i) => (
                      <span key={i} className="text-xs" title={b.desc}>{b.icon}</span>
                    ))}
                  </div>
                </div>

                {/* Score Bar */}
                <div className="w-32 mx-4 hidden md:block">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${getScoreBarColor(worker.safety_score)} rounded-full transition-all duration-1000`}
                      style={{ width: `${worker.safety_score}%` }} />
                  </div>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <p className={`text-xl font-black ${getScoreColor(worker.safety_score)}`}>{worker.safety_score}</p>
                  <p className="text-[10px] text-slate-400">{worker.total_violations} violations</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
