'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { normalizePhoneNumber } from '@/utils/sanitize';

export interface CountryCode {
  name: string;
  code: string; // ISO 2-letter
  dial: string; // e.g. "+49"
  flag: string; // emoji flag
}

export const COUNTRIES: CountryCode[] = [
  { name: 'Germany', code: 'DE', dial: '+49', flag: '🇩🇪' },
  { name: 'United Kingdom', code: 'GB', dial: '+44', flag: '🇬🇧' },
  { name: 'Russia', code: 'RU', dial: '+7', flag: '🇷🇺' },
  { name: 'Egypt', code: 'EG', dial: '+20', flag: '🇪🇬' },
  { name: 'Italy', code: 'IT', dial: '+39', flag: '🇮🇹' },
  { name: 'France', code: 'FR', dial: '+33', flag: '🇫🇷' },
  { name: 'Poland', code: 'PL', dial: '+48', flag: '🇵🇱' },
  { name: 'Switzerland', code: 'CH', dial: '+41', flag: '🇨🇭' },
  { name: 'Austria', code: 'AT', dial: '+43', flag: '🇦🇹' },
  { name: 'Netherlands', code: 'NL', dial: '+31', flag: '🇳🇱' },
  { name: 'Belgium', code: 'BE', dial: '+32', flag: '🇧🇪' },
  { name: 'Czech Republic', code: 'CZ', dial: '+420', flag: '🇨🇿' },
  { name: 'Slovakia', code: 'SK', dial: '+421', flag: '🇸🇰' },
  { name: 'Romania', code: 'RO', dial: '+40', flag: '🇷🇴' },
  { name: 'Hungary', code: 'HU', dial: '+36', flag: '🇭🇺' },
  { name: 'Sweden', code: 'SE', dial: '+46', flag: '🇸🇪' },
  { name: 'Norway', code: 'NO', dial: '+47', flag: '🇳🇴' },
  { name: 'Denmark', code: 'DK', dial: '+45', flag: '🇩🇰' },
  { name: 'Finland', code: 'FI', dial: '+358', flag: '🇫🇮' },
  { name: 'United States', code: 'US', dial: '+1', flag: '🇺🇸' },
  { name: 'Canada', code: 'CA', dial: '+1', flag: '🇨🇦' },
  { name: 'Saudi Arabia', code: 'SA', dial: '+966', flag: '🇸🇦' },
  { name: 'United Arab Emirates', code: 'AE', dial: '+971', flag: '🇦🇪' },
  { name: 'Kuwait', code: 'KW', dial: '+965', flag: '🇰🇼' },
  { name: 'Qatar', code: 'QA', dial: '+974', flag: '🇶🇦' },
  { name: 'Bahrain', code: 'BH', dial: '+973', flag: '🇧🇭' },
  { name: 'Oman', code: 'OM', dial: '+968', flag: '🇴🇲' },
  { name: 'Jordan', code: 'JO', dial: '+962', flag: '🇯🇴' },
  { name: 'Lebanon', code: 'LB', dial: '+961', flag: '🇱🇧' },
  { name: 'Kazakhstan', code: 'KZ', dial: '+7', flag: '🇰🇿' },
  { name: 'Ukraine', code: 'UA', dial: '+380', flag: '🇺🇦' },
  { name: 'Turkey', code: 'TR', dial: '+90', flag: '🇹🇷' },
  { name: 'China', code: 'CN', dial: '+86', flag: '🇨🇳' },
  { name: 'India', code: 'IN', dial: '+91', flag: '🇮🇳' },
  { name: 'Australia', code: 'AU', dial: '+61', flag: '🇦🇺' },
  { name: 'Spain', code: 'ES', dial: '+34', flag: '🇪🇸' },
  { name: 'Ireland', code: 'IE', dial: '+353', flag: '🇮🇪' },
];

interface CountryCodeSelectorProps {
  value: string; // The complete international phone number e.g. "+49171234567"
  onChange: (fullNumber: string) => void;
  error?: string;
  onBlur?: () => void;
}

export default function CountryCodeSelector({
  value,
  onChange,
  error,
  onBlur,
}: CountryCodeSelectorProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRIES[3]); // default Egypt (+20)
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [localInput, setLocalInput] = useState('');
  const isTypingRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse incoming value to detect country dial code and extract local digits
  useEffect(() => {
    if (!value) {
      if (!isTypingRef.current) setLocalInput('');
      return;
    }
    const clean = value.trim();
    if (clean.startsWith('+')) {
      const match = COUNTRIES.slice().sort((a, b) => b.dial.length - a.dial.length).find((c) => clean.startsWith(c.dial));
      if (match) {
        setSelectedCountry((prev) => (prev.code === match.code ? prev : match));
        if (!isTypingRef.current) {
          const rest = clean.slice(match.dial.length).trim();
          // Strip redundant trunk 0 from old stored values (e.g. +20010... -> 10...)
          const stripped = (rest.startsWith('0') && rest.length > 2) ? rest.replace(/^0+/, '') : rest;
          setLocalInput(stripped);
        }
        return;
      }
    }
    if (!isTypingRef.current) {
      setLocalInput(clean);
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch('');
    isTypingRef.current = false;
    const cleanDigits = localInput.replace(/\D/g, '').replace(/^0+/, '');
    if (cleanDigits) {
      const canonical = normalizePhoneNumber(`${country.dial}${cleanDigits}`, country.dial);
      onChange(canonical);
    } else {
      onChange(country.dial);
    }
  };

  const handleLocalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isTypingRef.current = true;
    const input = e.target.value;

    // If the customer pastes an international number starting with + or 00
    if (input.trim().startsWith('+') || input.trim().startsWith('00')) {
      const normalized = normalizePhoneNumber(input.trim());
      const match = COUNTRIES.slice().sort((a, b) => b.dial.length - a.dial.length).find((c) => normalized.startsWith(c.dial));
      if (match) {
        setSelectedCountry(match);
        const national = normalized.slice(match.dial.length);
        setLocalInput(national);
        onChange(normalized);
        isTypingRef.current = false;
        return;
      }
      onChange(normalized);
      isTypingRef.current = false;
      return;
    }

    // Normal typing: keep what the user types in local display (digits and spaces allowed)
    // Only strip non-digits except space
    const sanitizedInput = input.replace(/[^\d\s]/g, '');
    setLocalInput(sanitizedInput);

    const digitsOnly = sanitizedInput.replace(/\D/g, '');
    if (!digitsOnly) {
      onChange('');
      return;
    }

    // If user typed '0' as first character, keep displaying '0', but compute canonical E.164
    if (digitsOnly === '0') {
      onChange(selectedCountry.dial);
      return;
    }

    // If user types national format e.g. 01012345678, strip the trunk zero for E.164 canonical
    const nationalDigits = digitsOnly.startsWith('0') ? digitsOnly.slice(1) : digitsOnly;
    const fullNumber = `${selectedCountry.dial}${nationalDigits}`;
    const canonical = normalizePhoneNumber(fullNumber, selectedCountry.dial);
    onChange(canonical);
  };

  const handleInputBlur = () => {
    isTypingRef.current = false;
    // On blur, normalize the local display by stripping trunk 0 if present
    const digitsOnly = localInput.replace(/\D/g, '');
    if (digitsOnly.startsWith('0') && digitsOnly.length > 2) {
      setLocalInput(digitsOnly.slice(1));
    }
    if (onBlur) onBlur();
  };

  const placeholderText = useMemo(() => {
    switch (selectedCountry.code) {
      case 'EG':
        return '010 1234 5678';
      case 'DE':
        return '171 2345678';
      case 'GB':
        return '7123 456789';
      case 'US':
      case 'CA':
        return '555 123 4567';
      case 'SA':
      case 'AE':
        return '50 123 4567';
      default:
        return '123 456 7890';
    }
  }, [selectedCountry.code]);

  return (
    <div className="space-y-1">
      <div className="relative flex rounded-2xl border border-white/10 bg-white/[0.03] focus-within:border-[#00E5FF] transition-all">
        {/* Country Picker Button */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-full items-center gap-1.5 border-r border-white/10 px-3.5 py-3 text-sm font-bold text-white hover:bg-white/5 transition-colors rounded-l-2xl"
            title={`${selectedCountry.name} (${selectedCountry.dial})`}
          >
            <span className="text-lg leading-none">{selectedCountry.flag}</span>
            <span className="font-mono text-xs text-[#00E5FF]">{selectedCountry.dial}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#0B1528] p-2 shadow-2xl shadow-black/80 backdrop-blur-xl">
              {/* Search input */}
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2">
                <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search country or code..."
                  autoFocus
                  className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
                />
              </div>

              {/* List */}
              <div className="max-h-60 overflow-y-auto space-y-0.5">
                {filteredCountries.length === 0 ? (
                  <p className="p-3 text-center text-xs text-slate-500">No country found</p>
                ) : (
                  filteredCountries.map((c) => {
                    const isSelected = selectedCountry.code === c.code;
                    return (
                      <button
                        key={`${c.code}-${c.dial}`}
                        type="button"
                        onClick={() => handleCountrySelect(c)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-[#00E5FF]/10 text-[#00E5FF] font-bold'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-base">{c.flag}</span>
                          <span className="truncate">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="font-mono text-slate-400">{c.dial}</span>
                          {isSelected && <Check className="h-3 w-3 text-[#00E5FF]" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Local Phone Number Input */}
        <input
          id="phone"
          type="tel"
          value={localInput}
          onChange={handleLocalNumberChange}
          onBlur={handleInputBlur}
          placeholder={placeholderText}
          className="w-full rounded-r-2xl bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 font-medium"
        />
      </div>

      <p className="text-[11px] text-slate-500">
        Active WhatsApp format: <span className="font-mono text-[#00E5FF]">{value || `${selectedCountry.dial}...`}</span>
      </p>

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
