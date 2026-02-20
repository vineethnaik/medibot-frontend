import { api, API_BASE } from '@/lib/api';

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

// ── Razorpay ─────────────────────────────────────────────

export interface RazorpayOrderResponse {
  orderId: string;
  keyId: string;
  amount: number;
  currency: string;
}

export async function getRazorpayConfig() {
  return api<{ enabled: boolean }>('/api/razorpay/config');
}

export async function createRazorpayOrder(invoiceId: string | null, amount: number) {
  const body: Record<string, unknown> = { amount };
  if (invoiceId) body.invoice_id = invoiceId;
  return api<RazorpayOrderResponse>('/api/razorpay/order', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function verifyRazorpayPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  invoiceId: string
) {
  return api<{ success: boolean; payment: unknown }>('/api/razorpay/verify', {
    method: 'POST',
    body: JSON.stringify({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      invoice_id: invoiceId,
    }),
  });
}

export async function verifyRazorpayBooking(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  booking: {
    patient_id: string;
    doctor_id: string;
    appointment_date: string;
    reason?: string;
    hospital_id?: string | null;
    amount: number;
    doctor_name?: string;
  }
) {
  return api<{ success: boolean; appointment: unknown; invoice: unknown }>('/api/razorpay/verify-booking', {
    method: 'POST',
    body: JSON.stringify({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      ...booking,
    }),
  });
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

export async function fetchPatientRecord(_userId?: string) {
  try {
    const record = await api<any>('/api/patients/me');
    return record?.id ? record : null;
  } catch {
    return null;
  }
}

export async function updatePatientProfile(updates: {
  fullName?: string;
  dob?: string;
  gender?: string;
  insuranceProvider?: string;
  policyNumber?: string;
  hospitalId?: string;
  photoIdPath?: string;
  insuranceCardPath?: string;
  validationReport?: Record<string, unknown>;
}) {
  return api<any>('/api/patients/me', {
    method: 'PATCH',
    body: JSON.stringify({
      full_name: updates.fullName ?? null,
      dob: updates.dob ?? null,
      gender: updates.gender ?? null,
      insurance_provider: updates.insuranceProvider ?? null,
      policy_number: updates.policyNumber ?? null,
      hospital_id: updates.hospitalId ?? null,
      photo_id_path: updates.photoIdPath ?? null,
      insurance_card_path: updates.insuranceCardPath ?? null,
      validation_report: updates.validationReport ?? null,
    }),
  });
}

export async function createPatientRecord(record: {
  fullName: string;
  dob: string;
  gender: string;
  insuranceProvider: string;
  policyNumber: string;
  hospitalId?: string;
  photoIdPath?: string;
  insuranceCardPath?: string;
  validationReport?: Record<string, unknown>;
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
      photo_id_path: record.photoIdPath || null,
      insurance_card_path: record.insuranceCardPath || null,
      validation_report: record.validationReport || null,
    }),
  });
}

export async function fetchPendingPatients() {
  return api<any[]>('/api/patients/pending');
}

export async function fetchPatientById(id: string) {
  return api<any>(`/api/patients/${id}`);
}

export async function approvePatient(id: string) {
  return api<any>(`/api/patients/${id}/approve`, { method: 'POST' });
}

export async function rejectPatient(id: string) {
  return api<any>(`/api/patients/${id}/reject`, { method: 'POST' });
}

/** Fetch document with auth and return object URL for use in img src. Caller must revoke the URL when done. */
export async function fetchDocumentAsObjectUrl(filename: string): Promise<string> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/api/patients/documents/serve/${encodeURIComponent(filename)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to load document');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export function getDocumentUrl(filename: string): string {
  return `${API_BASE}/api/patients/documents/serve/${encodeURIComponent(filename)}`;
}

export async function uploadPatientDocument(file: File, type: 'photo_id' | 'insurance_card') {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  const res = await fetch(`${API_BASE}/api/patients/documents/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    let errMsg = `Upload failed (${res.status})`;
    try {
      const text = await res.text();
      if (text) {
        try {
          const err = JSON.parse(text) as { error?: string };
          errMsg = err.error || errMsg;
        } catch {
          errMsg = text;
        }
      }
    } catch {
      /* use default errMsg */
    }
    throw new Error(errMsg);
  }
  return res.json() as Promise<{ path: string; filename: string }>;
}

export async function validateOnboarding(formData: Record<string, string>, hasPhotoId: boolean, hasInsuranceCard: boolean) {
  return api<{
    documentVerification: string;
    documentVerificationReason: string;
    insuranceEligibility: string;
    insuranceEligibilityReason: string;
    riskAssessment: string;
    riskAssessmentReason: string;
    confidence: number;
    allPassed: boolean;
  }>('/api/patients/onboarding/validate', {
    method: 'POST',
    body: JSON.stringify({ formData, hasPhotoId, hasInsuranceCard }),
  });
}

export async function fetchAllPatients() {
  return api<any[]>('/api/patients');
}
