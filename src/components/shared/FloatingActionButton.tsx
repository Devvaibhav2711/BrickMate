import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
}

export const FloatingActionButton = ({ onClick, label }: FloatingActionButtonProps) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', bounce: 0.4 }}
      className="fixed right-4 bottom-24 z-40"
    >
      <Button
        variant="brick"
        size="icon-lg"
        onClick={onClick}
        className="rounded-full shadow-brick"
        aria-label={label || 'Add'}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </motion.div>
  );
};
