import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Upload, User, Shield, FileCheck, Loader2 } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { createPatientRecord } from '@/services/dataService';
import { api } from '@/lib/api';

const steps = ['Personal Info', 'Insurance Details', 'Documents', 'AI Validation'];

interface FormData {
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  insuranceProvider: string;
  policyNumber: string;
  groupNumber: string;
  hospitalId: string;
}

const PatientOnboarding: React.FC = () => {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, getValues, formState: { errors } } = useForm<FormData>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals-list'],
    queryFn: () => api<{ id: string; name: string }[]>('/api/hospitals?status=ACTIVE'),
  });
  const onSubmit = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      try {
        const values = getValues();
        await createPatientRecord({
          fullName: values.fullName,
          dob: values.dob,
          gender: values.gender || 'male',
          insuranceProvider: values.insuranceProvider || 'Blue Cross',
          policyNumber: values.policyNumber,
          hospitalId: values.hospitalId,
        });
        setSubmitted(true);
        queryClient.invalidateQueries({ queryKey: ['my-patient-record'] });
        toast({ title: 'Patient onboarded!', description: 'Your record has been created successfully.' });
      } catch (err: any) {
        toast({ title: 'Error', description: err.message || 'Failed to create patient record', variant: 'destructive' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patient Onboarding</h1>
          <p className="text-muted-foreground text-sm mt-1">Multi-step registration with AI validation</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  i < step ? 'bg-success/10 text-success' : i === step ? 'gradient-primary text-primary-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground'
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : <span className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-xs">{i + 1}</span>}
                <span className="hidden sm:inline">{s}</span>
              </motion.div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full transition-colors duration-500 ${i < step ? 'bg-success' : 'bg-border'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Card */}
        <div className="kpi-card">
          {submitted ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12 space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center"
              >
                <Check className="w-8 h-8 text-success" />
              </motion.div>
              <h3 className="text-lg font-semibold text-foreground">Patient Onboarded Successfully</h3>
              <p className="text-muted-foreground text-sm">Your patient record has been created.</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-semibold">
                <Shield className="w-4 h-4" /> Record Saved
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  {step === 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary mb-2"><User className="w-5 h-5" /><h3 className="font-semibold">Personal Information</h3></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label><input {...register('fullName', { required: true })} className="input-field" placeholder="John Doe" /></div>
                        <div><label className="block text-sm font-medium text-foreground mb-1.5">Date of Birth</label><input {...register('dob', { required: true })} type="date" className="input-field" /></div>
                        <div><label className="block text-sm font-medium text-foreground mb-1.5">Gender</label>
                          <select {...register('gender')} className="input-field"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select>
                        </div>
                        <div><label className="block text-sm font-medium text-foreground mb-1.5">Phone</label><input {...register('phone')} className="input-field" placeholder="(555) 123-4567" /></div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-foreground mb-1.5">Hospital</label>
                          <select {...register('hospitalId', { required: true })} className="input-field">
                            <option value="">Select your hospital…</option>
                            {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                          </select>
                          {hospitals.length === 0 && <p className="text-xs text-destructive mt-1">No hospitals available yet.</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary mb-2"><Shield className="w-5 h-5" /><h3 className="font-semibold">Insurance Details</h3></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-foreground mb-1.5">Insurance Provider</label>
                          <select {...register('insuranceProvider')} className="input-field"><option>Blue Cross</option><option>Aetna</option><option>United Health</option><option>Cigna</option><option>Humana</option></select>
                        </div>
                        <div><label className="block text-sm font-medium text-foreground mb-1.5">Policy Number</label><input {...register('policyNumber', { required: true })} className="input-field" placeholder="BC-2024-XXXXX" /></div>
                        <div><label className="block text-sm font-medium text-foreground mb-1.5">Group Number</label><input {...register('groupNumber')} className="input-field" placeholder="GRP-XXXXX" /></div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary mb-2"><Upload className="w-5 h-5" /><h3 className="font-semibold">Document Upload</h3></div>
                      {['Photo ID', 'Insurance Card'].map(label => (
                        <div key={label} className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-all duration-300 cursor-pointer hover:bg-primary/[0.02]">
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm font-medium text-foreground">Upload {label}</p>
                          <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary mb-2"><FileCheck className="w-5 h-5" /><h3 className="font-semibold">AI Validation</h3></div>
                      <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                        {[
                          { label: 'Document Verification', status: 'Passed' },
                          { label: 'Insurance Eligibility', status: 'Verified' },
                          { label: 'Risk Assessment', status: 'Processing', pending: true },
                        ].map((item, i) => (
                          <motion.div key={item.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }} className="flex justify-between items-center">
                            <span className="text-sm text-foreground">{item.label}</span>
                            <span className={`status-badge ${item.pending ? 'status-pending' : 'status-approved'}`}>{item.status}</span>
                          </motion.div>
                        ))}
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">AI Confidence</span>
                            <span className="font-semibold text-foreground">92%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} transition={{ duration: 1.2, ease: 'easeOut' }} className="h-full gradient-primary rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between pt-4 border-t border-border">
                <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-all duration-200 disabled:opacity-30">
                  Back
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-lg text-sm font-medium gradient-primary text-primary-foreground hover:opacity-90 transition-all hover-lift disabled:opacity-50">
                  {isSubmitting ? 'Saving…' : step === 3 ? 'Complete Onboarding' : 'Continue'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default PatientOnboarding;
