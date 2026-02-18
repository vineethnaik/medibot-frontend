import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/layout/PageTransition';
import { useQuery } from '@tanstack/react-query';
import { fetchPatientClaims, DbClaim } from '@/services/dataService';
import { Loader2 } from 'lucide-react';
import { useRealtimeClaims } from '@/hooks/useRealtimeClaims';

const MyClaims: React.FC = () => {
  const { user } = useAuth();
  const realtimeKeys = useMemo(() => [['my-claims', user?.id ?? '']], [user?.id]);
  useRealtimeClaims(realtimeKeys);

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['my-claims', user?.id],
    queryFn: () => fetchPatientClaims(user!.id),
    enabled: !!user?.id,
  });

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
          <h1 className="text-2xl font-bold text-foreground">My Claims</h1>
          <p className="text-muted-foreground text-sm mt-1">View your submitted insurance claims</p>
        </div>
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Claim #</th>
                  <th>Payer</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>AI Risk</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {claims.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No claims found</td></tr>
                ) : claims.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <td className="px-4 py-3 font-mono text-xs">{c.claim_number}</td>
                    <td className="px-4 py-3 text-foreground">{c.insurance_provider}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">${c.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(c.submitted_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-bold">{c.ai_risk_score !== null ? `${c.ai_risk_score}%` : '—'}</td>
                    <td className="px-4 py-3">{statusBadge(c.status)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default MyClaims;
