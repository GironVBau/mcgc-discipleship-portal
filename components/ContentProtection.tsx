'use client';

import { useEffect } from 'react';

export default function ContentProtection({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Block keyboard copy/select shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) && 
        ['c', 'u', 's', 'a', 'p'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }
    };

    // Block copy and cut clipboard operations
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    // Block drag selection initiation
    const handleSelectStart = (e: Event) => {
      // Allow selection inside text inputs or textareas if needed
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCopy);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCopy);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, []);

  return (
    <div 
      className="select-none" 
      style={{
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  );
}