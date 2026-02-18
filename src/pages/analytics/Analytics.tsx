import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PageTransition from '@/components/layout/PageTransition';
import AnimatedCounter from '@/components/layout/AnimatedCounter';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { dashboardService } from '@/services/dashboardService';
import { Loader2, TrendingUp, TrendingDown, DollarSign, BarChart3, ShieldAlert, Target } from 'lucide-react';
import { aiPerformance } from '@/services/mockData';

interface AnalyticsData {
  summary: {
    totalClaims: number;
    approvedClaims: number;
    deniedClaims: number;
    pendingClaims: number;
    totalRevenue: number;
    denialRate: number;
    avgRiskScore: number;
    totalBilled: number;
    totalCollected: number;
    collectionRate: number;
  };
  claimsByPayer: { name: string; value: number }[];
  monthlyTrend: { month: string; total: number; approved: number; denied: number; revenue: number }[];
  riskDistribution: { name: string; value: number }[];
}

async function fetchAnalytics(): Promise<AnalyticsData> {
  const [kpis, claimsByPayer, revenueTrend, denialDist] = await Promise.all([
    dashboardService.getKPIs(),
    dashboardService.getClaimsByPayer(),
    dashboardService.getRevenueTrend(),
    dashboardService.getDenialDistribution(),
  ]);
  const totalClaims = kpis.totalClaims;
  const approved = kpis.approvedClaims;
  const denied = totalClaims > 0 ? Math.round(totalClaims * (kpis.denialRate / 100)) : 0;
  const pending = Math.max(0, totalClaims - approved - denied);
  const totalCollected = kpis.revenueCollected;
  return {
    summary: {
      totalClaims,
      approvedClaims: approved,
      deniedClaims: denied,
      pendingClaims: pending,
      totalRevenue: totalCollected,
      denialRate: kpis.denialRate,
      avgRiskScore: 0,
      totalBilled: totalCollected,
      totalCollected,
      collectionRate: totalClaims > 0 ? Math.round((totalCollected / (totalClaims * 100)) * 100) : 0,
    },
    claimsByPayer: claimsByPayer.map((c: any) => ({ name: c.name, value: Number(c.value) })),
    monthlyTrend: revenueTrend.map((r: any) => ({ month: r.name, total: Number(r.value), approved: 0, denied: 0, revenue: Number(r.value) })),
    riskDistribution: denialDist.map((d: any) => ({ name: d.name, value: Number(d.value) })),
  };
}

const tooltipStyle = { borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card) / 0.95)', backdropFilter: 'blur(8px)' };
const COLORS = ['hsl(224,76%,33%)', 'hsl(199,89%,48%)', 'hsl(172,66%,40%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)'];

const Analytics: React.FC = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
  });

  if (isLoading) {
    return <PageTransition><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></PageTransition>;
  }

  const s = analytics?.summary;
  const hasData = s && s.totalClaims > 0;

  const kpis = [
    { label: 'Total Revenue', value: s?.totalRevenue || 0, prefix: '$', icon: DollarSign, color: 'text-success' },
    { label: 'Denial Rate', value: s?.denialRate || 0, suffix: '%', icon: ShieldAlert, color: 'text-destructive', decimals: 1 },
    { label: 'Collection Rate', value: s?.collectionRate || 0, suffix: '%', icon: Target, color: 'text-primary', decimals: 1 },
    { label: 'Avg Risk Score', value: s?.avgRiskScore || 0, icon: BarChart3, color: 'text-warning', decimals: 1 },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Revenue, denials, and AI performance insights</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="kpi-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{k.label}</span>
                <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
                  <k.icon className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">
                <AnimatedCounter value={k.value} prefix={k.prefix} suffix={k.suffix} decimals={k.decimals} />
              </p>
            </motion.div>
          ))}
        </div>

        {/* Claims Summary Bar */}
        {hasData && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Claims Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-success/5 border border-success/10">
                <p className="text-2xl font-bold text-success"><AnimatedCounter value={s!.approvedClaims} /></p>
                <p className="text-xs text-muted-foreground mt-1">Approved</p>
              </div>
              <div className="p-4 rounded-xl bg-warning/5 border border-warning/10">
                <p className="text-2xl font-bold text-warning"><AnimatedCounter value={s!.pendingClaims} /></p>
                <p className="text-xs text-muted-foreground mt-1">Pending</p>
              </div>
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                <p className="text-2xl font-bold text-destructive"><AnimatedCounter value={s!.deniedClaims} /></p>
                <p className="text-xs text-muted-foreground mt-1">Denied</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Claims & Revenue</h3>
            {analytics?.monthlyTrend && analytics.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={analytics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => name === 'revenue' ? `$${v.toLocaleString()}` : v} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(224,76%,33%)" fill="hsl(224,76%,33%)" fillOpacity={0.1} strokeWidth={2} name="Revenue" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No data yet</p>
            )}
          </motion.div>

          {/* Claims by Payer */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Claims by Payer</h3>
            {analytics?.claimsByPayer && analytics.claimsByPayer.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics.claimsByPayer}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="hsl(199,89%,48%)" radius={[6, 6, 0, 0]} name="Claims" animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No data yet</p>
            )}
          </motion.div>

          {/* Risk Distribution */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">AI Risk Distribution</h3>
            {analytics?.riskDistribution && analytics.riskDistribution.some(r => r.value > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={analytics.riskDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" animationDuration={1200}>
                    {analytics.riskDistribution.map((_, i) => (
                      <Cell key={i} fill={['hsl(172,66%,40%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)'][i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No data yet</p>
            )}
          </motion.div>

          {/* AI Performance (mock - stays as historical) */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">AI Model Performance</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={aiPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={[60, 100]} unit="%" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="accuracy" stroke="hsl(224,76%,33%)" strokeWidth={2.5} name="Accuracy %" animationDuration={1500} />
                <Line type="monotone" dataKey="automation" stroke="hsl(172,66%,40%)" strokeWidth={2.5} name="Automation %" animationDuration={1500} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Analytics;
