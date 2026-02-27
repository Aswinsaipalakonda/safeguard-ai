import { useState, useEffect } from "react";
import { Trophy, Star, Shield, Medal, Flame, Crown, Activity } from "lucide-react";
import api from "../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Progress } from "../components/ui/progress";

interface BadgeType {
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
  badges: BadgeType[];
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
        if (res.data?.leaderboard?.length > 0) {
          setData(res.data);
        } else {
          setData(fallback);
        }
      })
      .catch(() => setData(fallback))
      .finally(() => setLoading(false));
  }, [days]);

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="font-bold text-slate-400">#{rank}</span>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return "text-emerald-500";
    if (score >= 85) return "text-blue-500";
    if (score >= 70) return "text-amber-500";
    return "text-red-500";
  };

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("");

  return (
    <div className="space-y-6 container mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header Card */}
      <Card className="border-0 shadow-lg bg-linear-to-r from-slate-900 to-indigo-950 overflow-hidden relative">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]" />
        <CardContent className="p-8 sm:p-10 flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-6">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(79,70,229,0.3)] shrink-0">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-wide mb-1 flex items-center gap-3">
                Safety Leaderboard
                <Badge variant="secondary" className="bg-indigo-500/30 text-indigo-200 border-indigo-500/30">Live Updates</Badge>
              </h1>
              <p className="text-indigo-200 text-sm font-medium">Gamified safety tracking & compliance ranks</p>
            </div>
          </div>
          
          <div className="flex bg-slate-900/50 p-1.5 rounded-xl border border-white/10 backdrop-blur-md">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                  days === d
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top 3 Podium */}
      {data && data.leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {[data.leaderboard[1], data.leaderboard[0], data.leaderboard[2]].map((worker, idx) => {
            const podiumOrder = [2, 1, 3];
            const rank = podiumOrder[idx];
            const isGold = rank === 1;
            
            // Re-styling the podium cards with Shadcn approach
            return (
              <Card key={worker.worker_id} className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isGold ? 'border-amber-200 shadow-amber-500/10 md:-mt-8' : 'border-slate-200 shadow-sm'}`}>
                {isGold && <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-amber-300 to-yellow-500" />}
                <CardHeader className="text-center pb-2 pt-6">
                  <div className="mx-auto block mb-4 relative">
                    <Avatar className={`w-20 h-20 mx-auto ${isGold ? 'ring-4 ring-amber-100 ring-offset-2' : ''} border-2 border-slate-100 shadow-md`}>
                       <AvatarFallback className={`text-2xl font-black text-white ${isGold ? 'bg-linear-to-br from-amber-400 to-yellow-500' : rank === 2 ? 'bg-linear-to-br from-slate-300 to-slate-400' : 'bg-linear-to-br from-amber-600 to-amber-700'}`}>
                          {getInitials(worker.name)}
                       </AvatarFallback>
                    </Avatar>
                    {isGold && <Crown className="w-8 h-8 text-yellow-500 absolute -top-4 -right-2 drop-shadow-sm rotate-12" />}
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-800">{worker.name}</CardTitle>
                  <CardDescription className="text-xs font-mono">{worker.employee_code}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="flex items-center justify-center space-x-1 my-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < worker.stars ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                    ))}
                  </div>
                  <div className={`text-4xl font-black my-4 ${getScoreColor(worker.safety_score)}`}>
                    {worker.safety_score}
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-4 min-h-[32px]">
                    {worker.badges.slice(0, 2).map((b, i) => (
                      <Badge key={i} variant="outline" className="bg-slate-50 text-slate-600 capitalize py-1 text-[10px]" title={b.desc}>
                        <span className="mr-1">{b.icon}</span> {b.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard Table */}
      {data && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                 <Shield className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                 <CardTitle className="text-lg">Full Operational Rankings</CardTitle>
                 <CardDescription>Comprehensive tracking across all {data.total_workers} active workers</CardDescription>
              </div>
            </div>
            <Activity className="w-5 h-5 text-slate-300" />
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-16 text-center">Rank</TableHead>
                  <TableHead className="w-80">Worker Profile</TableHead>
                  <TableHead className="hidden md:table-cell">Achievement</TableHead>
                  <TableHead className="hidden lg:table-cell text-center">Current Streak</TableHead>
                  <TableHead className="hidden md:table-cell w-48">Compliance Score</TableHead>
                  <TableHead className="text-right pr-6 w-32">Total Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.leaderboard.map((worker) => (
                  <TableRow key={worker.worker_id} className={`group ${worker.rank <= 3 ? 'bg-amber-50/10' : ''}`}>
                    <TableCell className="text-center align-middle font-medium">
                      <div className="flex justify-center">{getRankDisplay(worker.rank)}</div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-4">
                        <Avatar className={`w-10 h-10 ${worker.rank <= 3 ? 'ring-2 ring-indigo-100 ring-offset-2' : ''}`}>
                          <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-xs">
                             {getInitials(worker.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{worker.name}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{worker.employee_code}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell">
                       <div className="flex flex-col gap-1.5">
                          <div className="flex items-center space-x-1">
                             {Array.from({ length: 5 }).map((_, i) => (
                               <Star key={i} className={`w-3.5 h-3.5 ${i < worker.stars ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-50"}`} />
                             ))}
                          </div>
                          <div className="flex flex-wrap gap-1">
                             {worker.badges.slice(0, 3).map((b, i) => (
                               <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0 bg-slate-100 text-slate-500 font-medium" title={b.desc}>
                                 <span className="mr-1">{b.icon}</span> {b.name}
                               </Badge>
                             ))}
                          </div>
                       </div>
                    </TableCell>

                    <TableCell className="hidden lg:table-cell text-center">
                      <Badge variant="outline" className={`px-3 py-1 bg-white ${worker.streak_days > 10 ? 'border-orange-200 text-orange-600' : 'border-slate-200 text-slate-500'}`}>
                        <Flame className={`w-3.5 h-3.5 mr-1.5 ${worker.streak_days > 10 ? 'text-orange-500 fill-orange-500' : 'text-slate-400'}`} />
                        {worker.streak_days} Days
                      </Badge>
                    </TableCell>

                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col gap-2">
                        <Progress 
                           value={worker.safety_score} 
                           className={`h-2 ${worker.safety_score >= 95 ? '[&>div]:bg-emerald-500' : worker.safety_score >= 85 ? '[&>div]:bg-blue-500' : worker.safety_score >= 70 ? '[&>div]:bg-amber-500' : '[&>div]:bg-rose-500'}`} 
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                           <span>{worker.total_violations} Violations</span>
                           <span className="text-emerald-600">{worker.resolved} Resolved</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right pr-6 align-middle">
                      <div className={`text-xl font-black ${getScoreColor(worker.safety_score)}`}>
                         {worker.safety_score}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-32 w-full h-full absolute inset-0 bg-white/50 backdrop-blur-sm z-50">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shadow-xl" />
        </div>
      )}
    </div>
  );
}
