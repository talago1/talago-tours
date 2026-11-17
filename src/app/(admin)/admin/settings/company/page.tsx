import CompanyLegalProfileDashboard from '@/components/admin/CompanyLegalProfileDashboard';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'Company & Legal Profile — TALAGO Admin',
};

export default function AdminSettingsCompanyPage() {
  return (
    <main className="min-h-screen bg-[#070F1E] px-4 py-5 text-[#F8FAFC] sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link
            href="/admin/settings"
            className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to System Settings
          </Link>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#00E5FF]">
            Official Corporate Governance
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white lg:text-5xl">
            Company & Legal Profile
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Configure your registered Egyptian corporate identity, Commercial Registry (السجل التجاري), Tax Card, Ministry of Tourism licenses, and business operating models securely without exposing sensitive secrets in public code.
          </p>
        </div>

        <CompanyLegalProfileDashboard />
      </div>
    </main>
  );
}
