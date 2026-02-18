import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/layout/PageTransition';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPatientInvoices, makePayment, fetchInvoiceItems, DbInvoice } from '@/services/dataService';
import { Loader2, X, CreditCard, DollarSign, CheckCircle, ChevronDown, ChevronUp, Shield, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

type RazorpayStep = 'choose' | 'details' | 'otp' | 'processing' | 'success';

const MakePayment: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [payModal, setPayModal] = useState<DbInvoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [rzpStep, setRzpStep] = useState<RazorpayStep>('choose');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [otp, setOtp] = useState('');

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['my-invoices', user?.id],
    queryFn: () => fetchPatientInvoices(user!.id),
    enabled: !!user?.id,
  });

  const { data: lineItems = [] } = useQuery({
    queryKey: ['invoice-items', expandedInvoice],
    queryFn: () => fetchInvoiceItems(expandedInvoice!),
    enabled: !!expandedInvoice,
  });

  const payMutation = useMutation({
    mutationFn: ({ invoiceId, amount }: { invoiceId: string; amount: number }) =>
      makePayment(invoiceId, amount, paymentMethod),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-invoices'] });
      qc.invalidateQueries({ queryKey: ['my-claims'] });
      qc.invalidateQueries({ queryKey: ['my-payments'] });
      setRzpStep('success');
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setRzpStep('details');
    },
  });

  const unpaidInvoices = invoices.filter(i => i.payment_status !== 'PAID');
  const paidInvoices = invoices.filter(i => i.payment_status === 'PAID');
  const totalOutstanding = unpaidInvoices.reduce((sum, i) => sum + i.total_amount, 0);

  const openRazorpay = (inv: DbInvoice) => {
    setPayModal(inv);
    setRzpStep('choose');
    setPaymentMethod('Credit Card');
    setCardNumber(''); setCardExpiry(''); setCardCvv(''); setUpiId(''); setOtp('');
  };

  const closeRazorpay = () => {
    setPayModal(null);
    setRzpStep('choose');
  };

  const handleProceedToOtp = () => {
    setRzpStep('otp');
  };

  const handleVerifyOtp = () => {
    if (!payModal) return;
    setRzpStep('processing');
    // Simulate processing delay then call real payment
    setTimeout(() => {
      payMutation.mutate({ invoiceId: payModal.id, amount: payModal.total_amount });
    }, 2000);
  };

  const itemTypeIcon = (type: string) => {
    switch (type) {
      case 'CONSULTATION': return '🩺';
      case 'SURGERY': return '🔪';
      case 'LAB': return '🔬';
      case 'MEDICATION': return '💊';
      case 'IMAGING': return '📷';
      case 'ROOM': return '🏥';
      case 'ANESTHESIA': return '💉';
      default: return '📋';
    }
  };

  const canProceed = () => {
    if (paymentMethod === 'UPI') return upiId.includes('@');
    return cardNumber.length >= 16 && cardExpiry.length >= 4 && cardCvv.length >= 3;
  };

  if (isLoading) {
    return <PageTransition><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></PageTransition>;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Make Payment</h1>
          <p className="text-muted-foreground text-sm mt-1">Pay your outstanding doctor fees and invoices</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Outstanding Balance</span>
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
                <DollarSign className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">₹{totalOutstanding.toLocaleString()}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Invoices</span>
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
                <CreditCard className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{unpaidInvoices.length}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Paid</span>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shadow-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{paidInvoices.length}</p>
          </motion.div>
        </div>

        {/* Unpaid Invoices */}
        {unpaidInvoices.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="kpi-card text-center py-12">
            <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3 opacity-60" />
            <p className="text-foreground font-semibold">All Paid!</p>
            <p className="text-sm text-muted-foreground mt-1">You have no outstanding invoices.</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Unpaid Invoices</h3>
            <div className="space-y-3">
              {unpaidInvoices.map((inv, i) => (
                <div key={inv.id}>
                  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <button onClick={() => setExpandedInvoice(prev => prev === inv.id ? null : inv.id)} className="p-1 rounded hover:bg-muted transition-colors">
                        {expandedInvoice === inv.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </button>
                      <div>
                        <p className="text-sm font-medium text-foreground">{inv.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">Due: {new Date(inv.due_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-foreground">₹{inv.total_amount.toLocaleString()}</span>
                      <button
                        onClick={() => openRazorpay(inv)}
                        className="px-4 py-2 rounded-lg bg-[#2B84EA] text-white text-xs font-medium hover:bg-[#1A6FD1] transition-all hover-lift flex items-center gap-1.5"
                      >
                        <Shield className="w-3 h-3" /> Pay with Razorpay
                      </button>
                    </div>
                  </motion.div>
                  <AnimatePresence>
                    {expandedInvoice === inv.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="ml-10 mt-2 mb-1 space-y-1.5">
                          {lineItems.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic py-2">No itemized breakdown available</p>
                          ) : lineItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-muted/10 border border-border/40">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{itemTypeIcon(item.item_type)}</span>
                                <span className="text-xs text-foreground">{item.description}</span>
                              </div>
                              <span className="text-xs font-semibold text-foreground">₹{item.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Payment History Section */}
        {paidInvoices.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Recent Payment History</h3>
            <div className="space-y-2">
              {paidInvoices.map((inv, i) => (
                <motion.div key={inv.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">₹{inv.total_amount.toLocaleString()}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">PAID via Razorpay</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Razorpay-style Payment Modal */}
      <AnimatePresence>
        {payModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={rzpStep !== 'processing' ? closeRazorpay : undefined}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
              className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>

              {/* Razorpay Header */}
              <div className="bg-[#2B84EA] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-white" />
                  <span className="text-white font-bold text-lg">Razorpay</span>
                  <span className="text-white/60 text-xs ml-1">DEMO</span>
                </div>
                {rzpStep !== 'processing' && (
                  <button onClick={closeRazorpay} className="p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white" /></button>
                )}
              </div>

              {/* Order Summary */}
              <div className="px-6 py-3 bg-[#F4F7FA] dark:bg-muted/20 border-b border-border/30 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">MediBots Health</p>
                  <p className="text-xs text-muted-foreground">{payModal.invoice_number}</p>
                </div>
                <p className="text-xl font-bold text-foreground">₹{payModal.total_amount.toLocaleString()}</p>
              </div>

              <div className="p-6">
                {/* Step: Choose Method */}
                {rzpStep === 'choose' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <p className="text-sm font-semibold text-foreground mb-3">Select Payment Method</p>
                    {['Credit Card', 'Debit Card', 'UPI', 'Net Banking'].map(method => (
                      <button key={method} onClick={() => { setPaymentMethod(method); setRzpStep('details'); }}
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                          paymentMethod === method ? 'border-[#2B84EA] bg-[#2B84EA]/5' : 'border-border hover:border-[#2B84EA]/40'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center text-sm">
                            {method === 'Credit Card' ? '💳' : method === 'Debit Card' ? '🏧' : method === 'UPI' ? '📱' : '🏦'}
                          </div>
                          <span className="text-sm font-medium text-foreground">{method}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </motion.div>
                )}

                {/* Step: Enter Details */}
                {rzpStep === 'details' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <button onClick={() => setRzpStep('choose')} className="text-xs text-[#2B84EA] hover:underline mb-1">← Change method</button>
                    <p className="text-sm font-semibold text-foreground">{paymentMethod} Details</p>

                    {paymentMethod === 'UPI' ? (
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">UPI ID</label>
                        <input
                          type="text" placeholder="yourname@upi"
                          value={upiId} onChange={e => setUpiId(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#2B84EA]/30 focus:border-[#2B84EA]"
                        />
                      </div>
                    ) : paymentMethod === 'Net Banking' ? (
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Select Bank</label>
                        <select
                          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#2B84EA]/30"
                          onChange={() => setCardNumber('1234567890123456')}
                        >
                          <option value="">Choose your bank</option>
                          <option>State Bank of India</option>
                          <option>HDFC Bank</option>
                          <option>ICICI Bank</option>
                          <option>Axis Bank</option>
                          <option>Kotak Mahindra Bank</option>
                        </select>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Card Number</label>
                          <input
                            type="text" placeholder="4111 1111 1111 1111" maxLength={19}
                            value={cardNumber} onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2B84EA]/30 focus:border-[#2B84EA]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Expiry</label>
                            <input
                              type="text" placeholder="MM/YY" maxLength={5}
                              value={cardExpiry} onChange={e => setCardExpiry(e.target.value.replace(/[^\d/]/g, '').slice(0, 5))}
                              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2B84EA]/30"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">CVV</label>
                            <input
                              type="password" placeholder="•••" maxLength={4}
                              value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2B84EA]/30"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <button
                      disabled={!canProceed() && paymentMethod !== 'Net Banking'}
                      onClick={handleProceedToOtp}
                      className="w-full py-3 rounded-xl bg-[#2B84EA] text-white text-sm font-semibold hover:bg-[#1A6FD1] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Pay ₹{payModal.total_amount.toLocaleString()}
                    </button>
                  </motion.div>
                )}

                {/* Step: OTP Verification */}
                {rzpStep === 'otp' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-[#2B84EA]/10 flex items-center justify-center">
                      <Shield className="w-8 h-8 text-[#2B84EA]" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">OTP Verification</p>
                    <p className="text-xs text-muted-foreground">Enter the OTP sent to your registered mobile (use any 6 digits for demo)</p>
                    <input
                      type="text" placeholder="Enter 6-digit OTP" maxLength={6}
                      value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-center text-lg font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#2B84EA]/30 focus:border-[#2B84EA]"
                    />
                    <button
                      disabled={otp.length < 6}
                      onClick={handleVerifyOtp}
                      className="w-full py-3 rounded-xl bg-[#2B84EA] text-white text-sm font-semibold hover:bg-[#1A6FD1] transition-all disabled:opacity-40"
                    >
                      Verify & Pay
                    </button>
                  </motion.div>
                )}

                {/* Step: Processing */}
                {rzpStep === 'processing' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-[#2B84EA] mx-auto" />
                    <p className="text-sm font-semibold text-foreground">Processing Payment…</p>
                    <p className="text-xs text-muted-foreground">Please do not close this window</p>
                  </motion.div>
                )}

                {/* Step: Success */}
                {rzpStep === 'success' && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center space-y-4">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                      className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </motion.div>
                    <p className="text-lg font-bold text-foreground">Payment Successful!</p>
                    <p className="text-sm text-muted-foreground">₹{payModal.total_amount.toLocaleString()} paid for {payModal.invoice_number}</p>
                    <p className="text-xs text-muted-foreground font-mono">TXN-{Date.now()}</p>
                    <button onClick={closeRazorpay}
                      className="w-full py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all">
                      Done
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-[#F4F7FA] dark:bg-muted/10 border-t border-border/30 flex items-center justify-center gap-2">
                <Shield className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Secured by Razorpay | 256-bit SSL Encryption (Demo Mode)</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};

export default MakePayment;
