import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Languages, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export const Header = () => {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'mr' : 'en');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      toast.error('Error signing out');
    }
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

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleLanguage}
            className="rounded-full"
          >
            <Languages className="w-5 h-5" />
            <span className="sr-only">Toggle Language</span>
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLogout}
            className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
            <span className="sr-only">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
