import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { dashboardService } from '@/services/dashboardService';
import { TrendingUp, CheckCircle, XCircle, DollarSign, Brain } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import AnimatedCounter from '@/components/layout/AnimatedCounter';
import PageTransition from '@/components/layout/PageTransition';

const CHART_COLORS = ['hsl(224,76%,33%)', 'hsl(199,89%,48%)', 'hsl(172,66%,40%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)'];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
  }),
};

const Dashboard: React.FC = () => {
  const { data: kpis, isLoading: kpiLoading } = useQuery({ queryKey: ['kpis'], queryFn: dashboardService.getKPIs });
  const { data: claimsDay } = useQuery({ queryKey: ['claimsDay'], queryFn: dashboardService.getClaimsPerDay });
  const { data: revenue } = useQuery({ queryKey: ['revenue'], queryFn: dashboardService.getRevenueTrend });
  const { data: denials } = useQuery({ queryKey: ['denials'], queryFn: dashboardService.getDenialDistribution });
  const { data: payers } = useQuery({ queryKey: ['payers'], queryFn: dashboardService.getClaimsByPayer });

  const kpiCards = kpis ? [
    { label: 'Total Claims', value: kpis.totalClaims, icon: TrendingUp, change: '+12.5%', prefix: '', suffix: '', decimals: 0 },
    { label: 'Approved Claims', value: kpis.approvedClaims, icon: CheckCircle, change: '+8.2%', prefix: '', suffix: '', decimals: 0 },
    { label: 'Denial Rate', value: kpis.denialRate, icon: XCircle, change: '-2.1%', prefix: '', suffix: '%', decimals: 1 },
    { label: 'Revenue Collected', value: kpis.revenueCollected / 1e6, icon: DollarSign, change: '+15.3%', prefix: '$', suffix: 'M', decimals: 1 },
    { label: 'AI Accuracy', value: kpis.aiAccuracy, icon: Brain, change: '+1.2%', prefix: '', suffix: '%', decimals: 1, glow: true },
  ] : [];

  const Skeleton = () => (
    <div className="kpi-card">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-8 w-16 bg-muted rounded" />
        <div className="h-3 w-20 bg-muted rounded" />
      </div>
    </div>
  );

  const tooltipStyle = { borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card) / 0.95)', backdropFilter: 'blur(8px)' };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Healthcare revenue cycle overview</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpiLoading
            ? Array(5).fill(0).map((_, i) => <Skeleton key={i} />)
            : kpiCards.map((card, i) => (
              <motion.div
                key={card.label}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className={`kpi-card ${card.glow ? 'ai-glow animate-glow-pulse' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.label}</span>
                  <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
                    <card.icon className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  <AnimatedCounter value={card.value} prefix={card.prefix} suffix={card.suffix} decimals={card.decimals} />
                </p>
                <span className={`text-xs font-semibold ${card.change.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
                  {card.change} vs last month
                </span>
              </motion.div>
            ))
          }
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }} className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Claims Processed Per Day</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={claimsDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="value" stroke="hsl(224,76%,33%)" strokeWidth={2.5} dot={{ r: 4 }} animationDuration={1500} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }} className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Area type="monotone" dataKey="value" stroke="hsl(172,66%,40%)" fill="hsl(172,66%,40%)" fillOpacity={0.12} strokeWidth={2} animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.4 }} className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Denial Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={denials} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11} animationDuration={1200}>
                  {denials?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.4 }} className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Claims by Payer</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={payers}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1200}>
                  {payers?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Dashboard;
