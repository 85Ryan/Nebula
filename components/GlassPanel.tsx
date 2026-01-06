import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-glass-panel backdrop-blur-2xl border border-glass-border shadow-2xl rounded-2xl ${className}`}>
      {children}
    </div>
  );
};