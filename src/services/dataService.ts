import { api } from '@/lib/api';

// ── Claims ──────────────────────────────────────────────

export interface DbClaim {
  id: string;
  claim_number: string;
  patient_id: string;
  insurance_provider: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'RESUBMITTED';
  ai_risk_score: number | null;
  ai_explanation: string | null;
  submitted_by: string;
  submitted_at: string;
  processed_at: string | null;
  created_at: string;
  patients?: { full_name: string; user_id: string } | null;
}

export async function fetchClaims() {
  return api<DbClaim[]>('/api/claims');
}

export async function fetchPatientClaims(_userId: string) {
  return api<DbClaim[]>('/api/claims/patient');
}

export async function createClaim(patientId: string, insuranceProvider: string, amount: number, appointmentId?: string) {
  const body: Record<string, unknown> = { patient_id: patientId, insurance_provider: insuranceProvider, amount };
  if (appointmentId) body.appointment_id = appointmentId;
  const claim = await api<DbClaim>('/api/claims', { method: 'POST', body: JSON.stringify(body) });
  return claim;
}

export async function fetchCompletedAppointmentsForClaims() {
  const appointments = await api<any[]>('/api/appointments');
  const completed = appointments.filter((a: any) => a.status === 'COMPLETED');
  const claims = await api<DbClaim[]>('/api/claims');
  const claimedIds = new Set(claims.map((c: DbClaim) => c.appointment_id).filter(Boolean));
  return completed.filter((a: any) => !claimedIds.has(a.id));
}

export async function manageClaim(claimId: string, action: 'approve' | 'reject') {
  return api<DbClaim>('/api/claims/manage', {
    method: 'POST',
    body: JSON.stringify({ claim_id: claimId, action }),
  });
}

// ── Invoices ────────────────────────────────────────────

export interface DbInvoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  claim_id: string | null;
  total_amount: number;
  due_date: string;
  payment_status: 'UNPAID' | 'PAID' | 'PARTIAL';
  created_at: string;
  patients?: { full_name: string; user_id: string } | null;
}

export async function fetchInvoices() {
  return api<DbInvoice[]>('/api/invoices');
}

export async function fetchPatientInvoices(_userId: string) {
  return api<DbInvoice[]>('/api/invoices/patient');
}

export async function generateInvoice(claimId: string, lineItems?: { description: string; amount: number; item_type: string }[]) {
  const body: Record<string, unknown> = { claim_id: claimId };
  if (lineItems?.length) body.line_items = lineItems;
  return api<DbInvoice>('/api/invoices/generate', { method: 'POST', body: JSON.stringify(body) });
}

export interface DbInvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  amount: number;
  item_type: string;
  created_at: string;
}

export async function fetchInvoiceItems(invoiceId: string) {
  return api<DbInvoiceItem[]>(`/api/invoices/${invoiceId}/items`);
}

// ── Payments ────────────────────────────────────────────

export interface DbPayment {
  id: string;
  invoice_id: string;
  amount_paid: number;
  payment_method: string;
  payment_date: string;
  transaction_id: string | null;
  paid_by: string;
  created_at: string;
  invoices?: { invoice_number: string; total_amount: number; patients?: { full_name: string } | null } | null;
}

export async function fetchPayments() {
  return api<DbPayment[]>('/api/payments');
}

export async function makePayment(invoiceId: string, amount: number, paymentMethod: string) {
  return api<DbPayment>('/api/payments', {
    method: 'POST',
    body: JSON.stringify({
      invoice_id: invoiceId,
      amount_paid: amount,
      payment_method: paymentMethod,
      transaction_id: `TXN-${Date.now()}`,
    }),
  });
}

// ── Patients ────────────────────────────────────────────

export async function fetchPatientRecord(userId: string) {
  const list = await api<any>('/api/patients/me');
  return list ?? null;
}

export async function createPatientRecord(record: {
  fullName: string;
  dob: string;
  gender: string;
  insuranceProvider: string;
  policyNumber: string;
  hospitalId?: string;
}) {
  return api<any>('/api/patients', {
    method: 'POST',
    body: JSON.stringify({
      full_name: record.fullName,
      dob: record.dob,
      gender: record.gender,
      insurance_provider: record.insuranceProvider,
      policy_number: record.policyNumber,
      hospital_id: record.hospitalId || null,
    }),
  });
}

export async function fetchAllPatients() {
  return api<any[]>('/api/patients');
}
