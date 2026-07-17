import { useEffect, useRef } from 'react';

/**
 * Loads list navigation intent into the primary tab (tab-1) instead of spawning a second tab.
 * Falls back to a default new document when the workspace opens without a pending intent.
 */
export function useWorkspaceListIntent<T extends { type: string }>(options: {
  initialTabId: string;
  consumeOpenIntent: (consumer: (intent: T) => void) => () => void;
  loadIntoTab: (tabId: string, intent: T) => Promise<void>;
  defaultNewIntent: T;
  onIntentLoaded?: () => void;
}) {
  const initializedRef = useRef(false);
  const loadIntoTabRef = useRef(options.loadIntoTab);
  loadIntoTabRef.current = options.loadIntoTab;

  const onIntentLoadedRef = useRef(options.onIntentLoaded);
  onIntentLoadedRef.current = options.onIntentLoaded;

  const initialTabIdRef = useRef(options.initialTabId);
  initialTabIdRef.current = options.initialTabId;

  const defaultNewIntentRef = useRef(options.defaultNewIntent);
  defaultNewIntentRef.current = options.defaultNewIntent;

  useEffect(() => {
    return options.consumeOpenIntent((intent) => {
      initializedRef.current = true;
      void loadIntoTabRef.current(initialTabIdRef.current, intent);
      onIntentLoadedRef.current?.();
    });
  }, [options.consumeOpenIntent]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (initializedRef.current) return;
      initializedRef.current = true;
      void loadIntoTabRef.current(initialTabIdRef.current, defaultNewIntentRef.current);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
}
