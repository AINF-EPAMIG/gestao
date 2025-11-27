import { useState } from 'react';

type ToastProps = {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export function useToast() {
  const toast = ({ title, description, variant }: ToastProps) => {
    // Implementação simples usando alert por enquanto
    // Em produção, você pode usar uma biblioteca como sonner ou react-hot-toast
    if (variant === 'destructive') {
      alert(`❌ ${title}\n${description || ''}`);
    } else {
      alert(`✓ ${title}\n${description || ''}`);
    }
  };

  return { toast };
}
