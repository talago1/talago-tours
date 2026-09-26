'use client';

import { useState } from 'react';
import { Plus, Trash2, HelpCircle, CheckSquare, List, AlignLeft, Hash, Phone, Calendar, MoveUp, MoveDown } from 'lucide-react';
import type { BookingQuestion, BookingQuestionType } from '@/types/tourEditor';

interface BookingQuestionsBuilderProps {
  questions: BookingQuestion[];
  onChange: (questions: BookingQuestion[]) => void;
}

const QUESTION_TYPES: { id: BookingQuestionType; label: string; icon: React.ElementType }[] = [
  { id: 'text', label: 'Short Text', icon: AlignLeft },
  { id: 'number', label: 'Number', icon: Hash },
  { id: 'phone', label: 'Phone Number', icon: Phone },
  { id: 'date', label: 'Date', icon: Calendar },
  { id: 'select', label: 'Dropdown Select', icon: List },
  { id: 'radio', label: 'Single Choice (Radio)', icon: CheckSquare },
  { id: 'checkbox', label: 'Multiple Choice (Checkbox)', icon: CheckSquare },
];

export default function BookingQuestionsBuilder({
  questions = [],
  onChange,
}: BookingQuestionsBuilderProps) {
  const [newOptionsText, setNewOptionsText] = useState<Record<string, string>>({});

  const addQuestion = (type: BookingQuestionType = 'text') => {
    const newQ: BookingQuestion = {
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      question: '',
      type,
      required: false,
      options: type === 'select' || type === 'radio' || type === 'checkbox' ? ['Option 1', 'Option 2'] : undefined,
      placeholder: '',
      helpText: '',
    };
    onChange([...questions, newQ]);
  };

  const updateQuestion = (id: string, patch: Partial<BookingQuestion>) => {
    onChange(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const removeQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    const reordered = [...questions];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    onChange(reordered);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#00E5FF]" />
            Dynamic Booking Questions
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Questions asked to lead travelers during checkout (e.g. dietary requirements, fin sizes, flight arrival).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => addQuestion('text')}
            className="flex items-center gap-1.5 rounded-xl bg-[#00E5FF] px-3.5 py-2 text-xs font-black text-[#070F1E] hover:opacity-90 shadow-md shadow-[#00E5FF]/20"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#070F1E]/50 p-8 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">No custom booking questions</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Add questions if you need specific information from guests before confirming the reservation.
            </p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            {['text', 'select', 'date'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addQuestion(t as BookingQuestionType)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10"
              >
                + Add {t}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const hasOptions = q.type === 'select' || q.type === 'radio' || q.type === 'checkbox';

            return (
              <div
                key={q.id}
                className="rounded-2xl border border-white/10 bg-[#070F1E] p-5 space-y-4 shadow-lg"
              >
                <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-[11px] font-black text-[#00E5FF]">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {q.type} Question
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveQuestion(idx, 'up')}
                      className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-30"
                      title="Move Up"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === questions.length - 1}
                      onClick={() => moveQuestion(idx, 'down')}
                      className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-30"
                      title="Move Down"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.id)}
                      className="p-1 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Question Label */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                      Question Label / Prompt *
                    </label>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                      placeholder="e.g. Any dietary restrictions or allergies?"
                      className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2.5 text-sm text-white focus:border-[#00E5FF] outline-none"
                    />
                  </div>

                  {/* Question Type */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                      Input Type
                    </label>
                    <select
                      value={q.type}
                      onChange={(e) => {
                        const newType = e.target.value as BookingQuestionType;
                        const needsOpts = newType === 'select' || newType === 'radio' || newType === 'checkbox';
                        updateQuestion(q.id, {
                          type: newType,
                          options: needsOpts ? q.options || ['Option 1', 'Option 2'] : undefined,
                        });
                      }}
                      className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3 py-2.5 text-xs text-white focus:border-[#00E5FF] outline-none"
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Optional Placeholder / HelpText & Required toggle */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Placeholder or Guidance (Optional)
                    </label>
                    <input
                      type="text"
                      value={q.placeholder || ''}
                      onChange={(e) => updateQuestion(q.id, { placeholder: e.target.value })}
                      placeholder="e.g. Vegetarian, Halal, None..."
                      className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3 py-2 text-xs text-white focus:border-[#00E5FF] outline-none"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                        className="h-4 w-4 rounded border-white/20 text-[#00E5FF] focus:ring-0"
                      />
                      <span className="text-xs font-bold text-slate-300">Mandatory (Required to book)</span>
                    </label>
                  </div>
                </div>

                {/* Options List for Select, Radio, Checkbox */}
                {hasOptions && (
                  <div className="rounded-xl border border-white/5 bg-[#0B1528] p-3.5 space-y-2.5">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">
                      Selectable Options
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(q.options || []).map((opt, optIdx) => (
                        <span
                          key={optIdx}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white font-medium"
                        >
                          {opt}
                          <button
                            type="button"
                            onClick={() => {
                              const next = (q.options || []).filter((_, i) => i !== optIdx);
                              updateQuestion(q.id, { options: next });
                            }}
                            className="text-slate-400 hover:text-red-400 ml-1"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 max-w-sm pt-1">
                      <input
                        type="text"
                        value={newOptionsText[q.id] || ''}
                        onChange={(e) => setNewOptionsText((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = (newOptionsText[q.id] || '').trim();
                            if (val) {
                              updateQuestion(q.id, { options: [...(q.options || []), val] });
                              setNewOptionsText((prev) => ({ ...prev, [q.id]: '' }));
                            }
                          }
                        }}
                        placeholder="Add option (press Enter)"
                        className="flex-1 rounded-xl border border-white/10 bg-[#070F1E] px-3 py-1.5 text-xs text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = (newOptionsText[q.id] || '').trim();
                          if (val) {
                            updateQuestion(q.id, { options: [...(q.options || []), val] });
                            setNewOptionsText((prev) => ({ ...prev, [q.id]: '' }));
                          }
                        }}
                        className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
