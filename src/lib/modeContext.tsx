import React, { createContext, useContext, useState, type ReactNode } from 'react';

type AppMode = 'leadership' | 'citizen';

interface ModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isLeadership: boolean;
  isCitizen: boolean;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>('leadership');

  return (
    <ModeContext.Provider value={{
      mode,
      setMode,
      isLeadership: mode === 'leadership',
      isCitizen: mode === 'citizen',
    }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used within ModeProvider');
  return ctx;
}
