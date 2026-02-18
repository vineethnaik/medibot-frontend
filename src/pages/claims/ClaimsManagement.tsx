import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { Search, Brain, ArrowUpDown, Download, X, Loader2, Plus } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClaims, manageClaim, createClaim, fetchCompletedAppointmentsForClaims, DbClaim } from '@/services/dataService';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeClaims } from '@/hooks/useRealtimeClaims';

type SortField = 'amount' | 'ai_risk_score';
type StatusFilter = 'all' | 'PENDING' | 'APPROVED' | 'DENIED';

const ClaimsManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  useRealtimeClaims();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedClaim, setSelectedClaim] = useState<DbClaim | null>(null);
  const [sortField, setSortField] = useState<SortField>('amount');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedApptId, setSelectedApptId] = useState('');
  const [claimAmount, setClaimAmount] = useState('');

  const canApprove = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.HOSPITAL_ADMIN || user?.role === UserRole.INSURANCE;
  const canExport = user?.role !== UserRole.PATIENT;
  const isReadOnly = user?.role === UserRole.AI_ANALYST;
  const canCreateClaim = user?.role === UserRole.BILLING || user?.role === UserRole.HOSPITAL_ADMIN || user?.role === UserRole.SUPER_ADMIN;

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: fetchClaims,
  });

  const { data: completedAppts = [] } = useQuery({
    queryKey: ['completed-appointments-for-claims'],
    queryFn: fetchCompletedAppointmentsForClaims,
    enabled: canCreateClaim,
  });

  const actionMutation = useMutation({
    mutationFn: ({ claimId, action }: { claimId: string; action: 'approve' | 'reject' }) =>
      manageClaim(claimId, action),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      setSelectedClaim(null);
      toast({ title: `Claim ${action === 'approve' ? 'Approved' : 'Rejected'}`, description: `The claim has been ${action === 'approve' ? 'approved' : 'rejected'} successfully.` });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const appt = completedAppts.find(a => a.id === selectedApptId);
      if (!appt) throw new Error('Select an appointment');
      const amount = parseFloat(claimAmount);
      if (!amount || amount <= 0) throw new Error('Enter a valid amount');
      const provider = (appt.patients as any)?.insurance_provider || 'Unknown';
      return createClaim(appt.patient_id, provider, amount, appt.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['completed-appointments-for-claims'] });
      setShowCreateModal(false);
      setSelectedApptId('');
      setClaimAmount('');
      toast({ title: 'Claim Created', description: 'The claim has been created with AI risk scoring.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const filtered = useMemo(() => {
    let result = claims.filter(c => {
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const name = c.patients?.full_name || '';
      const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || c.claim_number.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
    result.sort((a, b) => {
      const aVal = (a[sortField] ?? 0) as number;
      const bVal = (b[sortField] ?? 0) as number;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return result;
  }, [claims, search, statusFilter, sortField, sortDir]);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const exportCSV = () => {
    const headers = ['Claim Number', 'Patient', 'Payer', 'Amount', 'AI Risk Score', 'Status', 'Submitted'];
    const rows = filtered.map(c => [c.claim_number, c.patients?.full_name || '', c.insurance_provider, c.amount, c.ai_risk_score, c.status, c.submitted_at]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claims-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: string) => {
    const cls = status === 'APPROVED' ? 'status-approved' : status === 'PENDING' ? 'status-pending' : 'status-denied';
    return <span className={`status-badge ${cls}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
  };

  const riskColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    return score < 30 ? 'text-success' : score < 60 ? 'text-warning' : 'text-destructive';
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Claims Management</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isReadOnly ? 'View-only access to insurance claims' : 'Track and manage insurance claims'}
              {claims.length === 0 && ' — No claims yet'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isReadOnly && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]">Read Only</span>
            )}
            {canCreateClaim && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all hover-lift"
              >
                <Plus className="w-4 h-4" /> Create Claim
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search claims…" className="input-field pl-10" />
          </div>
          <div className="flex gap-2">
            {(['all', 'APPROVED', 'PENDING', 'DENIED'] as const).map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${statusFilter === s ? 'gradient-primary text-primary-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          {canExport && (
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-all duration-200 hover-lift">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
        </div>

        {/* Table */}
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Claim #</th>
                  <th>Patient</th>
                  <th>Payer</th>
                  <th className="cursor-pointer" onClick={() => { setSortField('amount'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
                    <span className="flex items-center gap-1">Amount <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="cursor-pointer" onClick={() => { setSortField('ai_risk_score'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
                    <span className="flex items-center gap-1">AI Risk <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No claims found</td></tr>
                ) : paged.map((claim, i) => (
                  <motion.tr
                    key={claim.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="cursor-pointer"
                    onClick={() => setSelectedClaim(claim)}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{claim.claim_number}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{claim.patients?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{claim.insurance_provider}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">${claim.amount.toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`font-bold ${riskColor(claim.ai_risk_score)}`}>{claim.ai_risk_score !== null ? `${claim.ai_risk_score}%` : '—'}</span></td>
                    <td className="px-4 py-3">{statusBadge(claim.status)}</td>
                    <td className="px-4 py-3">
                      <button className="text-xs font-medium text-primary hover:underline">View</button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-t border-border/60">
              <span className="text-xs text-muted-foreground">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-all duration-200 ${page === i + 1 ? 'gradient-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Claim Detail Modal */}
        <AnimatePresence>
          {selectedClaim && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm"
              onClick={() => setSelectedClaim(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ duration: 0.25 }}
                className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border shadow-2xl w-full max-w-lg mx-4 p-6"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Claim {selectedClaim.claim_number}</h3>
                  <button onClick={() => setSelectedClaim(null)} className="p-1 rounded-lg hover:bg-muted transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span className="font-medium text-foreground">{selectedClaim.patients?.full_name || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Payer</span><span className="text-foreground">{selectedClaim.insurance_provider}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold text-foreground">${selectedClaim.amount.toLocaleString()}</span></div>
                  <div className="flex justify-between items-center"><span className="text-muted-foreground">Status</span>{statusBadge(selectedClaim.status)}</div>
                  <div className="flex justify-between items-center"><span className="text-muted-foreground">AI Risk</span><span className={`font-bold ${riskColor(selectedClaim.ai_risk_score)}`}>{selectedClaim.ai_risk_score !== null ? `${selectedClaim.ai_risk_score}%` : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Submitted</span><span className="text-foreground">{new Date(selectedClaim.submitted_at).toLocaleDateString()}</span></div>
                  {selectedClaim.processed_at && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Processed</span><span className="text-foreground">{new Date(selectedClaim.processed_at).toLocaleDateString()}</span></div>
                  )}

                  {selectedClaim.ai_explanation && (
                    <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-2 mb-2"><Brain className="w-4 h-4 text-primary" /><span className="font-semibold text-foreground text-xs">AI Analysis</span></div>
                      <p className="text-muted-foreground text-xs leading-relaxed">{selectedClaim.ai_explanation}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-6">
                  {canApprove && selectedClaim.status === 'PENDING' && (
                    <>
                      <button
                        disabled={actionMutation.isPending}
                        onClick={() => actionMutation.mutate({ claimId: selectedClaim.id, action: 'approve' })}
                        className="flex-1 py-2.5 rounded-lg bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors disabled:opacity-50"
                      >
                        {actionMutation.isPending ? 'Processing…' : 'Approve'}
                      </button>
                      <button
                        disabled={actionMutation.isPending}
                        onClick={() => actionMutation.mutate({ claimId: selectedClaim.id, action: 'reject' })}
                        className="flex-1 py-2.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50"
                      >
                        {actionMutation.isPending ? 'Processing…' : 'Reject'}
                      </button>
                    </>
                  )}
                  {!canApprove && (
                    <p className="text-xs text-muted-foreground italic">You have view-only access to this claim.</p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Claim Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border shadow-2xl w-full max-w-md mx-4 p-6"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Create Claim from Appointment</h3>
                  <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>

                {completedAppts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No completed appointments available for claim creation.</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Completed Appointment</label>
                      <select
                        value={selectedApptId}
                        onChange={e => setSelectedApptId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                      >
                        <option value="">Select an appointment</option>
                        {completedAppts.map(a => (
                          <option key={a.id} value={a.id}>
                            {(a.patients as any)?.full_name || 'Unknown'} — {new Date(a.appointment_date).toLocaleDateString()} {a.reason ? `(${a.reason})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedApptId && (
                      <div className="p-3 rounded-lg bg-muted/20 text-xs text-muted-foreground">
                        <p><strong className="text-foreground">Patient:</strong> {(completedAppts.find(a => a.id === selectedApptId)?.patients as any)?.full_name}</p>
                        <p><strong className="text-foreground">Insurance:</strong> {(completedAppts.find(a => a.id === selectedApptId)?.patients as any)?.insurance_provider || 'N/A'}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Claim Amount ($)</label>
                      <input
                        type="number"
                        value={claimAmount}
                        onChange={e => setClaimAmount(e.target.value)}
                        placeholder="e.g. 1500"
                        min="1"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                      />
                    </div>

                    <button
                      onClick={() => createMutation.mutate()}
                      disabled={!selectedApptId || !claimAmount || createMutation.isPending}
                      className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {createMutation.isPending ? 'Creating…' : 'Create Claim with AI Scoring'}
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default ClaimsManagement;
