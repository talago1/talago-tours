/**
 * Tour Services & On-Trip Support Catalog
 * Managed in Admin Settings (SystemSetting key: "tour_services_catalog")
 * and assigned to individual tours.
 */

export interface TourServiceItem {
  id: string; // unique slug e.g. "live-tour-guide", "backup-service"
  name: string; // e.g. "Live Tour Guide"
  description: string; // e.g. "Professional certified guide throughout the experience"
  icon: string; // Lucide icon identifier e.g. "Languages", "Headphones", "ShieldCheck", "Car", "Smartphone"
  isActive: boolean; // whether available to assign in admin
  badgeText?: string; // optional badge e.g. "Guaranteed", "24/7 Support"
  order: number;
  translations?: Record<string, { name: string; description: string; badgeText?: string }>;
}

export const DEFAULT_TOUR_SERVICES: TourServiceItem[] = [
  {
    id: 'live-tour-guide',
    name: 'Live Tour Guide',
    description: 'Professional certified local guide providing commentary and guidance throughout the trip.',
    icon: 'Languages',
    isActive: true,
    badgeText: 'Expert Guide',
    order: 0,
    translations: {
      de: { name: 'Live-Reiseleiter', description: 'Professioneller zertifizierter Reiseleiter während der gesamten Tour.', badgeText: 'Experten-Guide' },
      ru: { name: 'Живой гид', description: 'Профессиональный лицензированный гид на протяжении всей экскурсии.', badgeText: 'Эксперт-гид' },
      fr: { name: 'Guide touristique en direct', description: 'Guide professionnel certifié tout au long de la visite.', badgeText: 'Guide expert' },
      it: { name: 'Guida turistica dal vivo', description: 'Guida professionale certificata durante tutta l\'esperienza.', badgeText: 'Guida esperta' },
      pl: { name: 'Przewodnik na żywo', description: 'Certyfikowany przewodnik towarzyszący podczas całej wycieczki.', badgeText: 'Przewodnik' },
      es: { name: 'Guía turístico en vivo', description: 'Guía profesional certificado durante toda la experiencia.', badgeText: 'Guía experto' },
    },
  },
  {
    id: 'backup-service',
    name: '24/7 On-Trip Support & Emergency Concierge',
    description: 'Dedicated TALAGO operations team on standby via WhatsApp & phone for immediate assistance during your trip.',
    icon: 'Headphones',
    isActive: true,
    badgeText: 'TALAGO Backup',
    order: 1,
    translations: {
      de: { name: '24/7 Notfall-Support & Concierge', description: 'Engagiertes TALAGO-Einsatzteam auf Abruf via WhatsApp & Telefon für sofortige Hilfe.', badgeText: 'TALAGO Schutz' },
      ru: { name: 'Круглосуточная поддержка 24/7', description: 'Служба поддержки TALAGO на связи по WhatsApp и телефону во время поездки.', badgeText: 'TALAGO Защита' },
      fr: { name: 'Assistance 24/7 & Conciergerie', description: 'Équipe d\'assistance TALAGO disponible par WhatsApp et téléphone.', badgeText: 'Garantie TALAGO' },
      it: { name: 'Supporto 24/7 e Concierge di emergenza', description: 'Team operativo TALAGO a disposizione via WhatsApp e telefono per assistenza immediata.', badgeText: 'Supporto TALAGO' },
      pl: { name: 'Wsparcie 24/7 na trasie', description: 'Dedykowany zespół TALAGO dostępny przez WhatsApp i telefon dla Twojego bezpieczeństwa.', badgeText: 'Ochrona TALAGO' },
      es: { name: 'Soporte 24/7 en ruta y conserjería', description: 'Equipo de operaciones TALAGO de guardia por WhatsApp y teléfono para asistencia inmediata.', badgeText: 'Soporte TALAGO' },
    },
  },
  {
    id: 'air-conditioned-transfer',
    name: 'Climate-Controlled Modern Transport',
    description: 'Comfortable, clean, air-conditioned passenger transport matching international tourism standards.',
    icon: 'Car',
    isActive: true,
    badgeText: 'Comfort Fleet',
    order: 2,
    translations: {
      de: { name: 'Klimatisierter moderner Transfer', description: 'Bequemer, sauberer und klimatisierter Transport nach internationalen Standards.' },
      ru: { name: 'Комфортабельный транспорт с кондиционером', description: 'Чистые современные микроавтобусы с кондиционером по туристическим стандартам.' },
    },
  },
  {
    id: 'instant-mobile-pass',
    name: 'Digital Boarding Pass & QR Check-in',
    description: 'No paper printing needed. Access your booking barcode and details directly on your phone.',
    icon: 'Smartphone',
    isActive: true,
    badgeText: 'Paperless',
    order: 3,
  },
];
