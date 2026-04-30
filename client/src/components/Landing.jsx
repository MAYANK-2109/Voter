import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiShield, FiRadio, FiUser, FiActivity, FiThermometer, FiMessageCircle } from 'react-icons/fi';

const PILLARS = [
  { 
    title: 'Pulse News', 
    desc: 'Real-time election updates tailored to your specific constituency.', 
    icon: FiRadio, 
    color: 'bg-saffron/10 text-saffron' 
  },
  { 
    title: 'Booth Pulse', 
    desc: 'Crowdsourced reports on EVM status and queue lengths.', 
    icon: FiActivity, 
    color: 'bg-india-green/10 text-india-green' 
  },
  { 
    title: 'Climate Watch', 
    desc: 'Heatwave alerts and AI-powered safe voting window recommendations.', 
    icon: FiThermometer, 
    color: 'bg-red-500/10 text-red-500' 
  },
  { 
    title: 'AI Bot', 
    desc: 'Instant answers to all your voting and documentation queries.', 
    icon: FiMessageCircle, 
    color: 'bg-indigo-500/10 text-indigo-500' 
  },
  { 
    title: 'Leaders', 
    desc: 'Comprehensive profiles and bios of your local elected representatives.', 
    icon: FiUser, 
    color: 'bg-india-blue/10 text-india-blue' 
  },
  { 
    title: 'Safety SOS', 
    desc: 'Advanced check-in system and emergency alerts for trusted contacts.', 
    icon: FiShield, 
    color: 'bg-orange-600/10 text-orange-600' 
  }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white overflow-hidden selection:bg-saffron/20">
      <div className="tricolor-stripe" />
      
      {/* Navbar */}
      <nav className="fixed top-1 w-full z-50 bg-white/70 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex flex-col overflow-hidden shadow-sm">
              <div className="flex-1 bg-saffron" />
              <div className="flex-1 bg-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full border-[0.5px] border-india-blue" />
              </div>
              <div className="flex-1 bg-india-green" />
            </div>
            <span className="font-bold text-lg text-text-primary">VoterPath<span className="text-saffron">2.0</span></span>
          </div>
          <div className="hidden sm:flex items-center gap-8 mr-8">
            <a href="#pillars" className="text-xs font-bold text-text-muted hover:text-india-blue transition-colors uppercase tracking-wider">Features</a>
            <a href="#" className="text-xs font-bold text-text-muted hover:text-india-blue transition-colors uppercase tracking-wider">Resources</a>
          </div>
          <Link to="/dashboard" className="btn-primary text-xs py-2 px-5">
            Launch Portal
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute inset-0 mandala-pattern -z-10 opacity-[0.02]" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="inline-block px-3 py-1 rounded-full bg-saffron/10 text-saffron text-[10px] font-bold uppercase tracking-widest">
                Election Resilience Engine
              </span>
              <span className="text-india-blue font-bold text-[10px]">●</span>
              <span className="text-india-green font-bold text-[10px] tracking-widest uppercase">Digital India</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-text-primary leading-[1.1] mb-6">
              Empowering India's <br/> <span className="heading-gradient">Democratic Pulse.</span>
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed mb-8 max-w-xl">
              VoterPath 2.0 is a next-generation civic resilience portal, designed to empower every Indian citizen with real-time data, safety tools, and AI-driven insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/dashboard" className="btn-primary text-base py-4 px-8">
                Launch Dashboard <FiArrowRight className="w-5 h-5" />
              </Link>
              <a href="#pillars" className="btn-outline text-base py-4 px-8 group">
                Explore Features <span className="group-hover:translate-x-1 transition-transform">→</span>
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute inset-0 bg-saffron/10 rounded-[2rem] blur-3xl -z-10" />
            <div className="p-2 bg-gradient-to-br from-saffron/20 via-white to-india-green/20 rounded-[2.2rem] shadow-2xl">
              <img 
                src="/voterpath_hero_banner_1777555965071.png" 
                alt="VoterPath Dashboard" 
                className="rounded-[2rem] border border-white"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pillars Section */}
      <section id="pillars" className="py-20 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="w-12 h-1.5 bg-gradient-to-r from-saffron via-white to-india-green mx-auto mb-6 rounded-full" />
            <h2 className="text-3xl lg:text-5xl font-black text-text-primary mb-4">The 6 Pillars of Resilience</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">Modern technology meeting the needs of the world's largest democracy.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PILLARS.map((p, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all"
              >
                <div className={`w-12 h-12 rounded-2xl ${p.color} flex items-center justify-center mb-6`}>
                  <p.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">{p.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-india-blue/5 rounded-full blur-3xl -z-10" />
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-black text-text-primary mb-6">Ready to join the movement?</h2>
          <p className="text-lg text-text-secondary mb-10">Access real-time insights and secure your democratic rights today.</p>
          <Link to="/dashboard" className="btn-primary inline-flex text-lg py-4 px-12 group">
            Get Started <FiArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 text-center bg-white relative">
        <div className="flex items-center justify-center gap-2 mb-4">
           <div className="w-6 h-6 rounded bg-white border border-slate-200 flex flex-col overflow-hidden shadow-xs">
              <div className="flex-1 bg-saffron" />
              <div className="flex-1 bg-india-green" />
            </div>
          <span className="font-bold text-text-primary">VoterPath 2.0</span>
        </div>
        <p className="text-xs text-text-muted mb-2">© 2024 VoterPath Resilience Project. Built with ❤️ for India.</p>
        <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Satyamev Jayate</p>
      </footer>
    </div>
  );
}
