import type { Metadata } from 'next';
import PrivacyContent from './PrivacyContent';

export const metadata: Metadata = {
  title: 'Privacy Policy — TALAGO',
  description: 'TALAGO privacy policy — how we collect, use, and protect your personal data.',
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
