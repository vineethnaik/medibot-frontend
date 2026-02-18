import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Loader2, Check, X, CheckCircle2 } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { toast } from 'sonner';

const DoctorAppointments: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['doctor-appointments', user?.id],
    queryFn: () => api<any[]>('/api/appointments/doctor'),
    enabled: !!user?.id,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api(`/api/appointments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    },
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['doctor-appointments'] });
      toast.success(`Appointment ${status.toLowerCase()}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusCls = (s: string) =>
    s === 'APPROVED' ? 'status-approved' : s === 'PENDING' ? 'status-pending' : s === 'COMPLETED' ? 'bg-primary/10 text-primary' : 'status-denied';

  const appointmentDate = (a: any) => a.appointment_date ?? a.appointmentDate ?? '';
  const getPatientName = (a: any) => {
    const p = a.patients ?? a.Patients;
    if (!p) return 'Patient';
    return (p.full_name ?? p.fullName ?? p.name ?? '').trim() || 'Patient';
  };

  if (isLoading) {
    return <PageTransition><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></PageTransition>;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your patient appointments</p>
        </div>

        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date & Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No appointments found</td></tr>
                ) : appointments.map((a, i) => (
                  <motion.tr key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className={a.status === 'PENDING' ? 'bg-primary/5' : ''}>
                    <td className="px-4 py-3 font-medium text-foreground">{getPatientName(a)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(appointmentDate(a)).toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{a.reason || '—'}</td>
                    <td className="px-4 py-3"><span className={`status-badge ${statusCls(a.status)}`}>{a.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {a.status === 'PENDING' && (
                          <>
                            <button onClick={() => updateStatus.mutate({ id: a.id, status: 'APPROVED' })} className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors" title="Approve">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => updateStatus.mutate({ id: a.id, status: 'REJECTED' })} className="p-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors" title="Reject">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {a.status === 'APPROVED' && (
                          <button onClick={() => updateStatus.mutate({ id: a.id, status: 'COMPLETED' })} className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors" title="Mark Complete">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
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

export default DoctorAppointments;
