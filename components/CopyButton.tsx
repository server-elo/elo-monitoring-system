"use client";
import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
interface CopyButtonProps {
  text: string;
  className?: string;
}
export default function CopyButton({
  text,
  className = "",
}: CopyButtonProps): void {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };
  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-surface-2 hover:bg-brand-surface-3 rounded-md transition-colors ${className}`}
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-green-500">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}
