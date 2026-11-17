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
      'Standard TALAGO Safari packages typically include quad bikes, safety gear, a professional convoy lead, Bedouin oasis dinner, and round-trip transfers. Exact inclusions vary — please check the inclusions list on your specific tour page.',
  },
  {
    question: 'What is your cancellation policy?',
    answer:
      'We offer flexible booking protection. The exact cancellation window varies per tour — most allow free cancellation up to 24–48 hours before departure. The applicable terms are shown on each tour page and confirmed at checkout.',
  },
  {
    question: 'What clothing is recommended for desert and sea tours?',
    answer:
      'For desert safaris, we suggest lightweight long pants, closed shoes, and sunglasses. We provide headscarves on many tours. For sea tours, bring swimwear and sunscreen; towels and snorkelling gear are included on water tours where specified.',
  },
  {
    question: 'How does TALAGO ensure guest safety?',
    answer:
      'Safety is our absolute baseline. Marine trips operate with trained crew, life jackets for all passengers, and emergency communication equipment. Desert convoys carry GPS tracking and first-aid certified support crew. Specific safety arrangements are listed on each tour page.',
  },
  {
    question: 'Do you provide hotel pickup?',
    answer:
      'Hotel pickup is included on most tours where specified in the inclusions. Simply provide your hotel name and room number during checkout, and our driver will meet you at the agreed pickup point.',
  },
  {
    question: 'What should I bring on a tour?',
    answer:
      'We recommend sunscreen, a hat, swimwear, a towel, and a camera. For desert safaris, closed-toe shoes and a light jacket are advised. Check the "What to Bring" section on your specific tour page for a complete list.',
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
