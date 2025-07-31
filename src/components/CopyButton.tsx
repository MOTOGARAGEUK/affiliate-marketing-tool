'use client';

import { useState } from 'react';
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';

interface CopyButtonProps {
  text: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export default function CopyButton({ 
  text, 
  disabled = false, 
  className = '',
  size = 'md'
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = async () => {
    if (disabled || !text) return;
    
    setIsLoading(true);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm'
  };

  const baseClasses = `${sizeClasses[size]} rounded font-medium transition-all duration-200 flex items-center justify-center`;
  
  const stateClasses = disabled 
    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
    : copied
    ? 'bg-green-500 text-white hover:bg-green-600'
    : 'bg-blue-500 text-white hover:bg-blue-600';

  return (
    <button
      onClick={handleCopy}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${stateClasses} ${className}`}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      ) : copied ? (
        <>
          <CheckIcon className="h-4 w-4 mr-1" />
          Copied
        </>
      ) : (
        <>
          <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
          Copy
        </>
      )}
    </button>
  );
} 