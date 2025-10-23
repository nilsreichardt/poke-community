"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

type PromptBlockProps = {
  prompt: string;
};

export function PromptBlock({ prompt }: PromptBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy prompt to clipboard", error);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Prompt</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex items-center gap-2"
        >
          <Copy className="h-4 w-4" />
          {copied ? "Copied!" : "Copy prompt"}
        </Button>
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-muted px-4 py-3 font-mono text-sm leading-6 text-foreground/90">
        {prompt}
      </pre>
    </div>
  );
}
