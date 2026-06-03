'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'What is included in the Safari package?',
    answer:
      'All TALAGO Safari packages include premium quad bikes, full safety gear, professional lead convoy, private Bedouin oasis dinner with barbecue, fresh juices, and round-trip transfers in luxury SUVs.',
  },
  {
    question: 'What is your cancellation policy?',
    answer:
      'We offer 100% flexible booking protection. You can cancel or reschedule up to 24 hours prior to departure for a full refund, no questions asked.',
  },
  {
    question: 'What clothing is recommended for desert and sea tours?',
    answer:
      'For desert safaris, we suggest lightweight long pants, closed shoes, and sunglasses. We provide high-quality headscarves. For sea tours, bring swimwear and sunscreen; we provide luxury towels and marine gear.',
  },
  {
    question: 'How does TALAGO ensure guest safety?',
    answer:
      'Safety is our absolute baseline. All marine trips carry professional rescue divers, satellite tracking, and full medical arrays. Desert convoys are tracked live with first-aid certified support crew.',
  },
  {
    question: 'Do you provide hotel pickup?',
    answer:
      'Yes, hotel pickup is included for most tours. Simply provide your hotel name and room number during checkout, and our driver will meet you in the lobby at your preferred pickup time.',
  },
  {
    question: 'What should I bring on a tour?',
    answer:
      'We recommend sunscreen, a hat, swimwear, a towel, and a camera. For desert safaris, closed-toe shoes and a light jacket are advised.',
  },
];

export default function FAQSection() {
  const { dict } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-[#070F1E] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.28em] text-[#06B6D4]">
            {dict.faq.badge}
          </p>
          <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            {dict.faq.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400">
            {dict.faq.description}
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`group border-b border-white/10 transition-all duration-300 ${
                  isOpen ? 'border-[#06B6D4]/30' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <div className="flex items-start gap-3">
                    <HelpCircle
                      className={`mt-0.5 h-5 w-5 shrink-0 transition-colors duration-300 ${
                        isOpen ? 'text-[#06B6D4]' : 'text-slate-500 group-hover:text-[#06B6D4]'
                      }`}
                    />
                    <span
                      className={`text-base font-bold leading-6 transition-colors duration-300 ${
                        isOpen ? 'text-white' : 'text-slate-300 group-hover:text-white'
                      }`}
                    >
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-all duration-300 ${
                      isOpen ? 'rotate-180 text-[#06B6D4]' : 'text-slate-500'
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-[500px] pb-5' : 'max-h-0'
                  }`}
                >
                  <p className="pl-10 text-sm leading-7 text-slate-400">{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
