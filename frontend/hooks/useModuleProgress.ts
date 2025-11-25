import { useCallback, useEffect, useMemo, useState } from 'react';
import tutorContent from '../shared-data/day4_tutor_content.json';

export interface ModuleProgressItem {
  id: string;
  title: string;
  completed: boolean;
  lastUpdated?: string;
}

interface UseModuleProgress {
  modules: ModuleProgressItem[];
  percentComplete: number;
  toggleComplete: (id: string) => void;
  markComplete: (id: string) => void;
  resetAll: () => void;
}

const STORAGE_KEY = 'moduleProgress:v1';

export function useModuleProgress(): UseModuleProgress {
  const initialModules: ModuleProgressItem[] = (tutorContent as any[]).map((m) => ({
    id: m.id,
    title: m.title,
    completed: false,
  }));

  const [modules, setModules] = useState<ModuleProgressItem[]>(initialModules);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ModuleProgressItem[];
        // Merge with any new modules
        const merged = initialModules.map((im) => {
          const existing = parsed.find((p) => p.id === im.id);
            return existing ? { ...im, ...existing } : im;
        });
        setModules(merged);
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
    } catch (e) {
      // ignore
    }
  }, [modules]);

  const percentComplete = useMemo(() => {
    if (!modules.length) return 0;
    const done = modules.filter((m) => m.completed).length;
    return Math.round((done / modules.length) * 100);
  }, [modules]);

  const toggleComplete = useCallback((id: string) => {
    setModules((prev) => prev.map((m) => m.id === id ? { ...m, completed: !m.completed, lastUpdated: new Date().toISOString() } : m));
  }, []);

  const markComplete = useCallback((id: string) => {
    setModules((prev) => prev.map((m) => m.id === id ? { ...m, completed: true, lastUpdated: new Date().toISOString() } : m));
  }, []);

  const resetAll = useCallback(() => {
    setModules(initialModules);
  }, [initialModules]);

  return { modules, percentComplete, toggleComplete, markComplete, resetAll };
}
