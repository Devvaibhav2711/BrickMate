import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export const Header = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'mr' : 'en');
  };

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brick flex items-center justify-center shadow-brick">
            <span className="text-xl">🧱</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">
              {language === 'en' ? 'Bricks Manager' : 'विट व्यवस्थापक'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {language === 'en' ? 'Business Management' : 'व्यवसाय व्यवस्थापन'}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleLanguage}
          className="rounded-full"
        >
          <Languages className="w-5 h-5" />
          <span className="sr-only">Toggle Language</span>
        </Button>
      </div>
    </header>
  );
};
