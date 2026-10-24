import NotificationTemplateEditor from '@/components/admin/notification-template-editor';
import NotificationDeliveryLog from '@/components/admin/notification-delivery-log';

export default function AdminNotificationsPage() {
  return (
    <main className="min-h-screen bg-[#070F1E] px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header — aligned with other admin pages */}
        <div className="mb-10">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#00E5FF]">
            Communication
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white lg:text-5xl">
            Notification Engine
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
            Manage WhatsApp and email templates and monitor real-time delivery status.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 shadow-2xl shadow-black/20 lg:p-8">
            <NotificationTemplateEditor />
          </section>
          <section className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 shadow-2xl shadow-black/20 lg:p-8">
            <NotificationDeliveryLog />
          </section>
        </div>
      </div>
    </main>
  );
}
