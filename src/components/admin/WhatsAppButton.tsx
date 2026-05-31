'use client';

import type { ActiveQueueTicket } from '@/types/booking';
import { buildWhatsAppMessage, buildWhatsAppUrl } from '@/utils/whatsappLinkBuilder';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  ticket: ActiveQueueTicket;
}

export default function WhatsAppButton({ ticket }: WhatsAppButtonProps) {
  const disabled = !ticket.customerPhone || ticket.customerPhone.trim().length === 0;

  const handleClick = () => {
    if (disabled) return;
    const message = buildWhatsAppMessage(ticket);
    const url = buildWhatsAppUrl(ticket.customerPhone, message);
    window.open(url, '_blank');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 ${
        disabled
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-[#25D366] text-white hover:bg-[#25D366]/90'
      }`}
      title={disabled ? 'No phone number available' : 'Send WhatsApp message'}
    >
      <MessageCircle className="w-3.5 h-3.5" />
      WhatsApp
    </button>
  );
}
