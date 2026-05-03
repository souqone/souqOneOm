import React from 'react';

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className = '' }: AuthCardProps) {
  return (
    <div
      className={`bg-white border border-outline/20 rounded-2xl p-5 sm:p-7 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
