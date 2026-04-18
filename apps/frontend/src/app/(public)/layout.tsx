import { Suspense } from 'react';
import { LanguageProvider } from '../../contexts/LanguageContext';
import PublicHeader from '../../components/layout/PublicHeader';
import BottomTabBar from '../../components/layout/BottomTabBar';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {/* Desktop-only header */}
      <div className="hidden sm:block">
        <PublicHeader />
      </div>
      {/* Bottom padding on mobile so page content isn't hidden behind the tab bar.
          The map page uses fixed inset-0 so it's unaffected by this padding. */}
      <div className="pb-14 sm:pb-0">
        <Suspense>{children}</Suspense>
      </div>
      <BottomTabBar />
    </LanguageProvider>
  );
}
