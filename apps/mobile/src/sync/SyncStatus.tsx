import { useIsFetching, useIsRestoring } from '@tanstack/react-query';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { SyncingError } from '@/api/client';

const SETTLE_GRACE_MS = 400;

interface SyncStatusValue {
  isSyncing: boolean;
  assertCanEdit: () => void;
}

const SyncStatusContext = createContext<SyncStatusValue | null>(null);

export function SyncStatusProvider({ children }: { children: ReactNode }) {
  const isRestoring = useIsRestoring();
  const isFetching = useIsFetching();
  const settledRef = useRef(false);
  const [graceOpen, setGraceOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setGraceOpen(true), SETTLE_GRACE_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (settledRef.current) return;

    if (isRestoring || !graceOpen || isFetching > 0) {
      setIsSyncing(true);
      return;
    }

    settledRef.current = true;
    setIsSyncing(false);
  }, [isRestoring, isFetching, graceOpen]);

  const value: SyncStatusValue = {
    isSyncing,
    assertCanEdit: () => {
      if (isSyncing) throw new SyncingError();
    },
  };

  return <SyncStatusContext.Provider value={value}>{children}</SyncStatusContext.Provider>;
}

export function useSyncStatus(): SyncStatusValue {
  const ctx = useContext(SyncStatusContext);
  if (!ctx) throw new Error('useSyncStatus precisa estar dentro de SyncStatusProvider');
  return ctx;
}
