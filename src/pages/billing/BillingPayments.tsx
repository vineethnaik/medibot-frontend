import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { Download, DollarSign, Clock, AlertTriangle, X, Loader2, FileText, Plus, CreditCard, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageTransition from '@/components/layout/PageTransition';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchInvoices, fetchClaims, generateInvoice, createRazorpayOrder, verifyRazorpayPayment } from '@/services/dataService';
import { openRazorpayCheckout } from '@/lib/razorpay';
import type { DbInvoice } from '@/services/dataService';
import AnimatedCounter from '@/components/layout/AnimatedCounter';

interface LineItem {
  description: string;
  amount: number;
  item_type: string;
}

const PROCEDURE_TYPES = [
  { label: 'Doctor Consultation Fee', type: 'CONSULTATION' },
  { label: 'Surgery / Operation', type: 'SURGERY' },
  { label: 'Lab Tests', type: 'LAB' },
  { label: 'Medication', type: 'MEDICATION' },
  { label: 'Imaging (X-Ray/MRI/CT)', type: 'IMAGING' },
  { label: 'Hospital Room Charges', type: 'ROOM' },
  { label: 'Anesthesia Fee', type: 'ANESTHESIA' },
  { label: 'Other', type: 'OTHER' },
];

const BillingPayments: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [payModal, setPayModal] = useState<DbInvoice | null>(null);
  const [payStep, setPayStep] = useState<'confirm' | 'processing' | 'success'>('confirm');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: 'Doctor Consultation Fee', amount: 0, item_type: 'CONSULTATION' },
  ]);

  const isBillingStaff = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.HOSPITAL_ADMIN || user?.role === UserRole.BILLING;
  const canPay = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.HOSPITAL_ADMIN || user?.role === UserRole.BILLING || user?.role === UserRole.PATIENT;

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
  });

  // Fetch approved claims that don't have invoices yet (for billing to generate)
  const { data: approvedClaims = [] } = useQuery({
    queryKey: ['approved-claims-for-invoice'],
    queryFn: async () => {
      const claims = await fetchClaims();
      const approvedOnly = claims.filter(c => c.status === 'APPROVED');
      // Filter out claims that already have invoices
      const invoiceClaimIds = new Set(invoices.filter(i => i.claim_id).map(i => i.claim_id));
      return approvedOnly.filter(c => !invoiceClaimIds.has(c.id));
    },
    enabled: isBillingStaff,
  });

  const handlePayWithRazorpay = async (inv: DbInvoice) => {
    try {
      const order = await createRazorpayOrder(inv.id, inv.total_amount);
      openRazorpayCheckout(
        { orderId: order.orderId, keyId: order.keyId, amount: order.amount, currency: order.currency },
        {
          name: 'MediBots Health',
          description: inv.invoice_number,
          onSuccess: async (paymentId, orderId, signature) => {
            setPayStep('processing');
            try {
              await verifyRazorpayPayment(orderId, paymentId, signature, inv.id);
              queryClient.invalidateQueries({ queryKey: ['invoices'] });
              toast({ title: 'Payment Successful!', description: 'Invoice has been paid.' });
              setPayStep('success');
              setTimeout(() => { setPayModal(null); setPayStep('confirm'); }, 1500);
            } catch (e) {
              toast({ title: 'Verification Failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
              setPayStep('confirm');
            }
          },
          onFailed: () => {
            toast({ title: 'Payment Failed', description: 'Please try again.', variant: 'destructive' });
          },
        }
      );
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Could not start payment. Is Razorpay configured?', variant: 'destructive' });
    }
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClaimId) throw new Error('Select a claim');
      const validItems = lineItems.filter(i => i.amount > 0 && i.description.trim());
      if (validItems.length === 0) throw new Error('Add at least one line item with an amount');
      return generateInvoice(selectedClaimId, validItems);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['approved-claims-for-invoice'] });
      toast({ title: 'Invoice Generated', description: 'The itemized invoice has been created.' });
      setShowGenerateModal(false);
      setSelectedClaimId('');
      setLineItems([{ description: 'Doctor Consultation Fee', amount: 0, item_type: 'CONSULTATION' }]);
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', amount: 0, item_type: 'OTHER' }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    if (field === 'item_type') {
      const proc = PROCEDURE_TYPES.find(p => p.type === value);
      updated[index] = { ...updated[index], item_type: value as string, description: proc?.label || updated[index].description };
    } else {
      (updated[index] as any)[field] = value;
    }
    setLineItems(updated);
  };

  const lineItemsTotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);

  const statusClass = (s: string) => s === 'PAID' ? 'status-approved' : s === 'PARTIAL' ? 'status-pending' : 'status-denied';
  const statusLabel = (s: string) => s === 'PAID' ? 'Paid' : s === 'PARTIAL' ? 'Partial' : 'Unpaid';

  const totalCollected = invoices.filter(i => i.payment_status === 'PAID').reduce((sum, i) => sum + i.total_amount, 0);
  const totalOutstanding = invoices.filter(i => i.payment_status !== 'PAID').reduce((sum, i) => sum + i.total_amount, 0);

  const kpis = [
    { label: 'Avg Payment Time', value: 12, suffix: ' days', icon: Clock },
    { label: 'Outstanding Revenue', value: totalOutstanding, prefix: '₹', icon: AlertTriangle },
    { label: 'Total Collected', value: totalCollected, prefix: '₹', icon: DollarSign },
  ];

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
            <h1 className="text-2xl font-bold text-foreground">
              {user?.role === UserRole.PATIENT ? 'Invoices' : 'Billing & Payments'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {user?.role === UserRole.PATIENT ? 'View your invoices and make payments' : 'Manage invoices and payment tracking'}
            </p>
          </div>
          {isBillingStaff && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all hover-lift"
            >
              <FileText className="w-4 h-4" /> Generate Invoice
            </button>
          )}
        </div>

        {user?.role !== UserRole.PATIENT && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {kpis.map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="kpi-card flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-sm"><k.icon className="w-5 h-5 text-primary-foreground" /></div>
                <div><p className="text-xs text-muted-foreground">{k.label}</p><p className="text-lg font-bold text-foreground"><AnimatedCounter value={k.value} prefix={k.prefix} suffix={k.suffix} /></p></div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Patient</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No invoices found</td></tr>
                ) : invoices.map((inv, i) => (
                  <motion.tr key={inv.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{inv.patients?.full_name || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">₹{inv.total_amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(inv.due_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><span className={`status-badge ${statusClass(inv.payment_status)}`}>{statusLabel(inv.payment_status)}</span></td>
                    <td className="px-4 py-3 flex gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><Download className="w-4 h-4" /></button>
                      {canPay && inv.payment_status !== 'PAID' && <button onClick={() => setPayModal(inv)} className="text-xs font-medium text-primary hover:underline">Pay Now</button>}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pay Modal (Razorpay) */}
        <AnimatePresence>
          {payModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30" onClick={payStep !== 'processing' ? () => setPayModal(null) : undefined}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Pay with Razorpay</h3>
                  {payStep !== 'processing' && <button onClick={() => setPayModal(null)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5 text-muted-foreground" /></button>}
                </div>
                <p className="text-sm text-muted-foreground mb-2">Invoice {payModal.invoice_number}</p>
                <p className="text-lg font-bold text-foreground mb-4">₹{payModal.total_amount.toLocaleString()}</p>
                {payStep === 'confirm' && (
                  <>
                    <p className="text-xs text-muted-foreground mb-4">Pay securely via UPI, cards, net banking</p>
                    <button
                      onClick={() => handlePayWithRazorpay(payModal)}
                      className="w-full py-2.5 rounded-lg bg-[#2B84EA] text-white text-sm font-medium hover:bg-[#1A6FD1] transition-all flex items-center justify-center gap-2"
                    >
                      <Shield className="w-4 h-4" /><CreditCard className="w-4 h-4" /> Pay ₹{payModal.total_amount.toLocaleString()}
                    </button>
                  </>
                )}
                {payStep === 'processing' && (
                  <div className="py-6 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#2B84EA] mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">Verifying payment…</p>
                  </div>
                )}
                {payStep === 'success' && (
                  <div className="py-4 text-center">
                    <p className="text-sm font-semibold text-emerald-600">Payment successful!</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate Invoice Modal */}
        <AnimatePresence>
          {showGenerateModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30" onClick={() => setShowGenerateModal(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Generate Itemized Invoice</h3>
                  <button onClick={() => setShowGenerateModal(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>

                {approvedClaims.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No approved claims available for invoice generation.</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Approved Claim</label>
                      <select value={selectedClaimId} onChange={e => setSelectedClaimId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                        <option value="">Select a claim</option>
                        {approvedClaims.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.claim_number} — {c.patients?.full_name || 'Unknown'} (${c.amount})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-muted-foreground">Invoice Line Items</label>
                        <button onClick={addLineItem} className="text-xs text-primary hover:underline flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add Item
                        </button>
                      </div>
                      <div className="space-y-3">
                        {lineItems.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-muted/20 space-y-2">
                            <div className="flex items-center gap-2">
                              <select
                                value={item.item_type}
                                onChange={e => updateLineItem(idx, 'item_type', e.target.value)}
                                className="flex-1 px-2 py-1.5 rounded-md border border-border bg-background text-foreground text-xs"
                              >
                                {PROCEDURE_TYPES.map(p => (
                                  <option key={p.type} value={p.type}>{p.label}</option>
                                ))}
                              </select>
                              {lineItems.length > 1 && (
                                <button onClick={() => removeLineItem(idx)} className="p-1 rounded hover:bg-destructive/10 text-destructive">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={item.description}
                              onChange={e => updateLineItem(idx, 'description', e.target.value)}
                              placeholder="Description"
                              className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-foreground text-xs"
                            />
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">$</span>
                              <input
                                type="number"
                                value={item.amount || ''}
                                onChange={e => updateLineItem(idx, 'amount', parseFloat(e.target.value) || 0)}
                                placeholder="Amount"
                                min="0"
                                className="flex-1 px-2 py-1.5 rounded-md border border-border bg-background text-foreground text-xs"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10 flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">Total</span>
                        <span className="text-lg font-bold text-foreground">${lineItemsTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => generateMutation.mutate()}
                      disabled={!selectedClaimId || lineItemsTotal <= 0 || generateMutation.isPending}
                      className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {generateMutation.isPending ? 'Generating…' : 'Generate Invoice'}
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

export default BillingPayments;
