
import { motion } from 'framer-motion';
import { Shield, Activity, Users, Video, ChevronRight, Lock, Eye, AlertTriangle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Video className="w-6 h-6 text-blue-500" />,
      title: 'Real-time Monitoring',
      description: 'AI-powered continuous live feed analysis for safety compliance across all zones.'
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-orange-500" />,
      title: 'Violation Detection',
      description: 'Instant alerts for PPE non-compliance, unauthorized access, and hazard zones.'
    },
    {
      icon: <Activity className="w-6 h-6 text-green-500" />,
      title: 'Insights & Analytics',
      description: 'Comprehensive incident timelines, heatmaps, and worker safety profiles.'
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Background gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-emerald-600/10 blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-white/70">SafeGuard AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">Platform</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Customers</a>
        </div>
        <div className="flex gap-4 items-center">
          <Link to="/login" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors hidden sm:block">
            Management Login
          </Link>
          <Button onClick={() => navigate('/worker-login')} className="bg-white text-black hover:bg-neutral-200 rounded-full px-6 font-semibold shadow-xl shadow-white/10">
            Worker Kiosk <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 pt-20 pb-32 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-blue-400 mb-8 backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Next-Gen AI Factory Safety
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 leading-tight"
        >
          Protect Your <br className="hidden sm:block"/>
          <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-purple-400 to-blue-400 animate-gradient-x">
            Workforce with AI
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl text-lg md:text-xl text-neutral-400 mb-12 font-medium leading-relaxed"
        >
          Comprehensive computer vision platform that automates safety compliance, monitors zones, and gamifies worker protection in real-time.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Button 
            size="lg" 
            onClick={() => navigate('/login')}
            className="h-14 px-8 text-base bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white border-0 shadow-lg shadow-blue-500/25 rounded-full"
          >
            <Lock className="w-5 h-5 mr-2" /> Admin & Supervisor Login
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate('/worker-login')}
            className="h-14 px-8 text-base border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 text-white backdrop-blur-md rounded-full"
          >
            <Eye className="w-5 h-5 mr-2" /> Open Worker Kiosk
          </Button>
        </motion.div>

        {/* Dashboard Preview / Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-24 relative w-full max-w-5xl"
        >
          <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/20 to-transparent z-10 bottom-0 top-1/2 rounded-b-xl" />
          <div className="relative rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-2 md:p-4 shadow-2xl shadow-blue-900/20 overflow-hidden">
             {/* Mock Dashboard Top Bar */}
             <div className="flex items-center gap-2 mb-4 px-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
             </div>
             {/* Mock Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8">
              <div className="h-48 rounded-lg bg-neutral-900/60 border border-white/5 p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 text-sm font-medium">Active Cameras</span>
                  <Video className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">12/12</div>
                  <div className="text-xs text-blue-400 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5"></span> All systems operational</div>
                </div>
              </div>
              <div className="h-48 rounded-lg bg-neutral-900/60 border border-emerald-500/20 shadow-[0_0_30px_-5px_var(--color-emerald-500)] shadow-emerald-500/10 p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 text-sm font-medium">Safety Score</span>
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-emerald-400 mb-1">98.5%</div>
                  <div className="text-xs text-emerald-500">+2.4% from last week</div>
                </div>
              </div>
              <div className="h-48 rounded-lg bg-neutral-900/60 border border-white/5 p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 text-sm font-medium">Active Workers</span>
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">142</div>
                  <div className="text-xs text-neutral-500">Currently in active zones</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for Modern Safety</h2>
          <p className="text-neutral-400 max-w-2xl mx-auto text-lg leading-relaxed">
            SafeGuard AI brings cutting-edge computer vision to your factory floor without the complexity.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <Card key={idx} className="bg-neutral-900/40 border-white/5 backdrop-blur-sm hover:bg-neutral-900/80 transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-neutral-400 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 pb-12 pt-12 text-center text-sm text-neutral-600 border-t border-white/5">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="w-5 h-5" />
          <span className="font-semibold text-neutral-300">SafeGuard AI</span>
        </div>
        <p>© 2026 SafeGuard AI Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
