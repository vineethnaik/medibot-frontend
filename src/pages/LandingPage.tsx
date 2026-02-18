import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { roleDefaultRoute } from '@/config/sidebarConfig';
import { Navigate } from 'react-router-dom';
import {
  Activity, Brain, Shield, Zap, BarChart3, Bot,
  ArrowRight, Check, Star, ChevronRight
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={roleDefaultRoute[user.role]} replace />;
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Grid pattern bg */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v40H0zM40 0h1v40h-1z' fill='%231E3A8A' fill-opacity='0.015'/%3E%3Cpath d='M0 0v1h40V0zM0 40v1h40v-1z' fill='%231E3A8A' fill-opacity='0.015'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-info/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-accent/[0.03] rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 lg:px-12 h-20 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary shadow-md flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">MediBots</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          {['features', 'how-it-works', 'pricing'].map((id) => (
            <button
              key={id}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-foreground transition-colors"
            >
              {id === 'how-it-works' ? 'How It Works' : id.charAt(0).toUpperCase() + id.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link to="/signup" className="text-sm font-medium gradient-primary text-primary-foreground px-5 py-2.5 rounded-lg shadow-sm hover:opacity-90 transition-all hover-lift">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/[0.08] border border-primary/10 text-primary text-xs font-semibold mb-6">
              <Zap className="w-3.5 h-3.5" /> AI-Powered Revenue Cycle Management
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.1] tracking-tight"
          >
            Transform Healthcare
            <br />
            <span className="bg-gradient-to-r from-[hsl(224,76%,33%)] via-[hsl(199,89%,48%)] to-[hsl(172,66%,40%)] bg-clip-text text-transparent">
              Revenue Operations
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto leading-relaxed"
          >
            Reduce claim denials by 40%, automate billing workflows, and unlock real-time AI insights 
            — all in one enterprise-grade platform built for modern healthcare.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
          >
            <Link to="/signup" className="flex items-center gap-2 gradient-primary text-primary-foreground px-8 py-3.5 rounded-xl text-sm font-semibold shadow-lg hover:opacity-90 transition-all hover-lift">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted/60 transition-all">
              See How It Works <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-6 mt-10 text-xs text-muted-foreground"
          >
            {['HIPAA Compliant', 'SOC 2 Certified', '99.9% Uptime'].map((badge) => (
              <span key={badge} className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-success" />{badge}</span>
            ))}
          </motion.div>
        </div>

        {/* Dashboard preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/60 shadow-2xl p-1.5 overflow-hidden">
            <div className="bg-muted/40 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
                <span className="text-xs text-muted-foreground ml-2 font-mono">dashboard.medibots.io</span>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Total Claims', val: '12,847', color: 'from-[hsl(224,76%,33%)] to-[hsl(199,89%,48%)]' },
                  { label: 'Revenue', val: '$2.4M', color: 'from-[hsl(172,66%,40%)] to-[hsl(199,89%,48%)]' },
                  { label: 'Denial Rate', val: '4.2%', color: 'from-[hsl(38,92%,50%)] to-[hsl(0,72%,51%)]' },
                  { label: 'AI Accuracy', val: '97.8%', color: 'from-[hsl(199,89%,48%)] to-[hsl(172,66%,40%)]' },
                ].map(card => (
                  <div key={card.label} className="bg-card rounded-lg border border-border/40 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{card.label}</p>
                    <p className={`text-lg font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>{card.val}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card rounded-lg border border-border/40 p-4 h-28">
                  <p className="text-[10px] text-muted-foreground mb-2">Claims Trend</p>
                  <div className="flex items-end gap-1 h-14">
                    {[40, 55, 45, 60, 50, 70, 65, 80, 75, 85, 90, 88].map((h, i) => (
                      <div key={i} className="flex-1 gradient-primary rounded-t-sm" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
                <div className="bg-card rounded-lg border border-border/40 p-4 h-28">
                  <p className="text-[10px] text-muted-foreground mb-2">AI Processing</p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="relative w-16 h-16">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="85 100" strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">85%</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>4/5 bots active</p>
                      <p className="text-success font-medium">All systems nominal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <div className="text-center mb-16">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
            Platform Capabilities
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl lg:text-4xl font-bold text-foreground">
            Everything You Need to Optimize
            <br />Healthcare Revenue
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: 'AI Claim Analysis', desc: 'Predict denial risks before submission with 97%+ accuracy using deep learning models trained on millions of claims.', color: 'from-[hsl(224,76%,33%)] to-[hsl(199,89%,48%)]' },
            { icon: Bot, title: 'Automated Workflows', desc: 'Intelligent bots handle claim scrubbing, eligibility checks, and prior authorizations — reducing manual work by 80%.', color: 'from-[hsl(199,89%,48%)] to-[hsl(172,66%,40%)]' },
            { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Live dashboards with KPI tracking, denial patterns, payer performance, and revenue forecasting at a glance.', color: 'from-[hsl(172,66%,40%)] to-[hsl(158,60%,38%)]' },
            { icon: Shield, title: 'HIPAA & SOC 2 Ready', desc: 'Enterprise-grade security with end-to-end encryption, audit trails, and role-based access controls built in.', color: 'from-[hsl(224,76%,33%)] to-[hsl(172,66%,40%)]' },
            { icon: Zap, title: 'Smart Patient Portal', desc: 'Self-service portal for patients to view claims, make payments, and track reimbursements in real time.', color: 'from-[hsl(38,92%,50%)] to-[hsl(199,89%,48%)]' },
            { icon: Activity, title: 'Multi-Payer Integration', desc: 'Seamless connectivity with all major payers including Blue Cross, Aetna, United Health, Cigna, and Humana.', color: 'from-[hsl(199,89%,48%)] to-[hsl(224,76%,33%)]' },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group kpi-card hover:border-primary/20"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-sm mb-4`}>
                <feature.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <div className="text-center mb-16">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
            Simple Setup
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl lg:text-4xl font-bold text-foreground">
            Get Started in Minutes
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Connect Your Systems', desc: 'Integrate your EHR, practice management, and payer portals in a few clicks.' },
            { step: '02', title: 'AI Learns Your Data', desc: 'Our models analyze your historical claims to identify patterns and optimize workflows.' },
            { step: '03', title: 'Watch Revenue Grow', desc: 'Automated processing, fewer denials, faster payments — results from day one.' },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="text-5xl font-extrabold bg-gradient-to-b from-primary/20 to-transparent bg-clip-text text-transparent mb-4">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <div className="text-center mb-16">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
            Pricing
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl lg:text-4xl font-bold text-foreground">
            Plans That Scale With You
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-muted-foreground mt-3 max-w-md mx-auto">
            Start free, upgrade when you're ready. No hidden fees.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              name: 'Starter',
              price: '$299',
              period: '/month',
              desc: 'For small practices getting started with AI-powered RCM.',
              features: ['Up to 500 claims/month', 'Basic AI denial prediction', '2 user seats', 'Email support', 'Standard analytics'],
              cta: 'Start Free Trial',
              popular: false,
            },
            {
              name: 'Professional',
              price: '$799',
              period: '/month',
              desc: 'For growing organizations that need full automation.',
              features: ['Up to 5,000 claims/month', 'Advanced AI + automation bots', '10 user seats', 'Priority support', 'Real-time analytics & API', 'Custom workflows'],
              cta: 'Start Free Trial',
              popular: true,
            },
            {
              name: 'Enterprise',
              price: 'Custom',
              period: '',
              desc: 'For large health systems with complex needs.',
              features: ['Unlimited claims', 'Full AI suite + custom models', 'Unlimited users', 'Dedicated success manager', 'SLA & on-prem options', 'HIPAA BAA included'],
              cta: 'Contact Sales',
              popular: false,
            },
          ].map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`kpi-card relative flex flex-col ${plan.popular ? 'border-primary/30 shadow-xl ring-1 ring-primary/10' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="gradient-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-sm flex items-center gap-1">
                    <Star className="w-3 h-3" /> Most Popular
                  </span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={`w-full text-center py-3 rounded-lg text-sm font-semibold transition-all hover-lift ${
                  plan.popular
                    ? 'gradient-primary text-primary-foreground shadow-sm'
                    : 'border border-border text-foreground hover:bg-muted/60'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl gradient-primary p-12 lg:p-16 text-center"
        >
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M27 18h6v24h-6z' fill='white' fill-opacity='0.15'/%3E%3Cpath d='M18 27h24v6H18z' fill='white' fill-opacity='0.15'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }} />
          <h2 className="relative text-2xl lg:text-3xl font-bold text-primary-foreground mb-4">
            Ready to Revolutionize Your Revenue Cycle?
          </h2>
          <p className="relative text-primary-foreground/80 mb-8 max-w-md mx-auto">
            Join 500+ healthcare organizations already using MediBots to reduce denials and accelerate collections.
          </p>
          <Link to="/signup" className="relative inline-flex items-center gap-2 bg-white text-[hsl(224,76%,33%)] px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg hover:bg-white/90 transition-all hover-lift">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-12 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground">MediBots</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span>© 2026 MediBots Inc.</span>
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">HIPAA Compliance</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
