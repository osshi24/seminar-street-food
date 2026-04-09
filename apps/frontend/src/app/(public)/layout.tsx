import { LanguageProvider } from '../../contexts/LanguageContext';
import PublicHeader from '../../components/layout/PublicHeader';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <PublicHeader />
      <div>{children}</div>
    </LanguageProvider>
  );
}
