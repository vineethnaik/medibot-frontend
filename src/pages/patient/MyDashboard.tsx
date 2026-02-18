import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { FileText, DollarSign, Clock, CheckCircle } from 'lucide-react';
import AnimatedCounter from '@/components/layout/AnimatedCounter';
import PageTransition from '@/components/layout/PageTransition';
import { useQuery } from '@tanstack/react-query';
import { fetchPatientClaims, fetchPatientInvoices } from '@/services/dataService';
import { Loader2 } from 'lucide-react';

const MyDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: claims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['my-claims', user?.id],
    queryFn: () => fetchPatientClaims(user!.id),
    enabled: !!user?.id,
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['my-invoices', user?.id],
    queryFn: () => fetchPatientInvoices(user!.id),
    enabled: !!user?.id,
  });

  const isLoading = claimsLoading || invoicesLoading;
  const pendingInvoices = invoices.filter(i => i.payment_status !== 'PAID').length;
  const totalPaid = invoices.filter(i => i.payment_status === 'PAID').reduce((sum, i) => sum + i.total_amount, 0);
  const approvedClaims = claims.filter(c => c.status === 'APPROVED').length;

  const kpis = [
    { label: 'My Claims', value: claims.length, icon: FileText },
    { label: 'Pending Invoices', value: pendingInvoices, icon: Clock },
    { label: 'Total Paid', value: totalPaid, icon: DollarSign, prefix: '$' },
    { label: 'Approved Claims', value: approvedClaims, icon: CheckCircle },
  ];

  const statusBadge = (status: string) => {
    const cls = status === 'APPROVED' ? 'status-approved' : status === 'PENDING' ? 'status-pending' : 'status-denied';
    return <span className={`status-badge ${cls}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
  };

  if (isLoading) {
    return <PageTransition><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></PageTransition>;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, {user?.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">Your health dashboard overview</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="kpi-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{k.label}</span>
                <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
                  <k.icon className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">
                <AnimatedCounter value={k.value} prefix={k.prefix} />
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Claims</h3>
          <div className="space-y-3">
            {claims.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No claims yet</p>
            ) : claims.slice(0, 3).map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.insurance_provider} — ${c.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{new Date(c.submitted_at).toLocaleDateString()}</p>
                </div>
                {statusBadge(c.status)}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default MyDashboard;
