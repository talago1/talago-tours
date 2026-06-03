'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface AccordionItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionItem({ question, answer, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden transition-all duration-300 hover:border-[#06B6D4]/30">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-5 text-left font-black text-white hover:text-[#06B6D4]"
      >
        <span className="flex items-center gap-3 text-lg leading-snug">
          <HelpCircle className="h-5 w-5 text-[#EAB308] shrink-0" />
          {question}
        </span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-slate-500 shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-500 shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="border-t border-white/5 bg-[#070F1E]/50 px-6 py-5">
          <p className="text-sm leading-7 text-slate-300">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const { dict } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqItems = [
    { q: dict.faq.q1.q, a: dict.faq.q1.a },
    { q: dict.faq.q2.q, a: dict.faq.q2.a },
    { q: dict.faq.q3.q, a: dict.faq.q3.a },
    { q: dict.faq.q4.q, a: dict.faq.q4.a },
  ];

  return (
    <main className="min-h-screen bg-[#070F1E] text-[#F8FAFC]">
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#0EA5E9/10,transparent_50%),radial-gradient(circle_at_70%_70%,#EAB308/10,transparent_50%)]" />
        <div className="relative mx-auto max-w-4xl px-5 sm:px-8 lg:px-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#EAB308]/30 bg-[#EAB308]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#EAB308]">
            <ShieldAlert className="h-3.5 w-3.5" />
            {dict.faq.badge}
          </span>
          <h1 className="mt-8 text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
            {dict.faq.title}
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300 sm:text-xl">
            {dict.faq.description}
          </p>
        </div>
      </section>

      <section className="py-12 pb-24">
        <div className="mx-auto max-w-3xl px-5">
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                question={item.q}
                answer={item.a}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
