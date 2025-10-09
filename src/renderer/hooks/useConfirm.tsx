import React, { createContext, useContext, useState } from 'react';
import ConfirmModal from '../components/common/ConfirmModal';

type ConfirmOptions = {
  title?: string;
  message: string;
};

type ConfirmContextValue = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<{
    opts: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);

  const confirm = (opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ opts, resolve });
    });
  };

  const handleConfirm = () => {
    if (!pending) return;
    pending.resolve(true);
    setPending(null);
  };
  const handleCancel = () => {
    if (!pending) return;
    pending.resolve(false);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {pending && (
        <ConfirmModal
          title={pending.opts.title}
          message={pending.opts.message}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
};

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    console.warn('useConfirm used outside ConfirmProvider - falling back to window.confirm');
    return async (opts: ConfirmOptions) => window.confirm(opts.message);
  }
  return ctx.confirm;
}
