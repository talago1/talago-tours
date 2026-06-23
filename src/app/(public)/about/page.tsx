export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { parseSettingValue } from '@/lib/systemSettings';
import AboutPageComponent from './AboutPage';

export default async function AboutPage() {
  const bannerSetting = await prisma.systemSetting.findUnique({
    where: { key: 'banners' },
  });

  const bannerData = bannerSetting
    ? parseSettingValue<{ aboutPhilosophyImage?: string }>(bannerSetting.value, {})
    : {};
  const aboutPhilosophyImage = bannerData.aboutPhilosophyImage || '';

  return <AboutPageComponent aboutPhilosophyImage={aboutPhilosophyImage} />;
}
