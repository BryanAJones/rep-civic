import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { EmailGateModal } from './EmailGateModal';
import { setPendingIntent, type PendingIntentInput } from '../../utils/pendingIntent';

interface RequireEmailArgs {
  intent: PendingIntentInput;
  message?: string;
}

interface EmailGateContextValue {
  requireEmail: (args: RequireEmailArgs) => void;
}

const EmailGateContext = createContext<EmailGateContextValue | null>(null);

export function EmailGateProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string>('Verify your email to continue.');

  const requireEmail = useCallback(({ intent, message: msg }: RequireEmailArgs) => {
    setPendingIntent(intent);
    if (msg) setMessage(msg);
    setOpen(true);
  }, []);

  return (
    <EmailGateContext.Provider value={{ requireEmail }}>
      {children}
      {open && <EmailGateModal message={message} onClose={() => setOpen(false)} />}
    </EmailGateContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEmailGate(): EmailGateContextValue {
  const ctx = useContext(EmailGateContext);
  if (!ctx) throw new Error('useEmailGate must be used within EmailGateProvider');
  return ctx;
}
