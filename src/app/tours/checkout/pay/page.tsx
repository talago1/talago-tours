import { Suspense } from 'react';
import PaymentPageInner from './PaymentPageInner';

function LoadingFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070F1E]">
      <div className="text-center">
        <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-[#00E5FF]/20 border-t-[#00E5FF]" />
        <p className="text-lg font-medium text-white">Loading payment...</p>
      </div>
    </main>
  );
}

export default function PaymentPageWrapper() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentPageInner />
    </Suspense>
  );
}
