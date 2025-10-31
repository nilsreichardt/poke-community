"use client";

import { useEffect, useRef, useState } from "react";
import type { SVGProps } from "react";
import { Check, ChevronDown, Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type PromptBlockProps = {
  prompt: string;
  variant?: "card" | "plain";
  className?: string;
};

export function PromptBlock({
  prompt,
  variant = "card",
  className,
}: PromptBlockProps) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error("Failed to copy prompt to clipboard", error);
    }
  }

  function handleSend(target: MessageTarget) {
    const encodedPrompt = encodeURIComponent(prompt);
    const url =
      target === "sms"
        ? `sms:+16507501551?body=${encodedPrompt}`
        : `https://wa.me/18338569052?text=${encodedPrompt}`;

    try {
      const opened = window.open(url, "_blank", "noopener,noreferrer");

      if (!opened) {
        console.error("Popup blocked; failed to open messaging app");
      }
    } catch (error) {
      console.error("Failed to open messaging app", error);
    }
  }

  const containerClasses =
    variant === "plain"
      ? "space-y-3"
      : "space-y-3 rounded-2xl border border-border bg-card/60 p-6";

  return (
    <div className={cn(containerClasses, className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Prompt</h2>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Send Poke
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => handleSend("sms")}
                className="flex cursor-pointer items-center gap-2"
              >
                <IMessageIcon className="h-4 w-4 text-[#0FB548]" />
                <span>iMessage</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleSend("whatsapp")}
                className="flex cursor-pointer items-center gap-2"
              >
                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                <span>WhatsApp</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopy}
            aria-label="Copy prompt"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="sr-only">Copy prompt</span>
          </Button>
        </div>
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-muted px-4 py-3 font-mono text-sm leading-6 text-foreground/90">
        {prompt}
      </pre>
    </div>
  );
}

type MessageTarget = "sms" | "whatsapp";

function WhatsAppIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      {...props}
    >
      <path d="M12.01 2a9.95 9.95 0 0 0-8.5 15.1l-1.32 4.83 4.96-1.3A9.98 9.98 0 1 0 12.01 2Zm0 18a8 8 0 0 1-4.07-1.12l-.28-.17-2.94.77.79-2.88-.18-.29A8 8 0 1 1 12.01 20Zm4.55-5.77c-.25-.13-1.48-.73-1.7-.81-.23-.08-.4-.12-.57.13-.17.25-.65.81-.8.98-.15.17-.29.19-.53.06-.25-.13-1.03-.38-1.96-1.21-.72-.64-1.21-1.43-1.35-1.67-.14-.25-.01-.37.12-.5.12-.12.25-.29.37-.43.12-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.57-1.38-.78-1.9-.2-.48-.4-.41-.57-.42l-.49-.01c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09 0 1.23.9 2.43 1.03 2.6.13.17 1.77 2.8 4.29 3.92.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.48-.6 1.69-1.19.21-.59.21-1.09.15-1.19-.06-.1-.23-.17-.47-.3Z" />
    </svg>
  );
}

function IMessageIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 3.25c4.83 0 8.75 3.2 8.75 7.14 0 3.94-3.92 7.14-8.75 7.14-.5 0-.98-.03-1.45-.1l-3.49 2.06a.75.75 0 0 1-1.12-.65l.07-2.5C3.88 14.79 3.25 13.19 3.25 10.4 3.25 6.45 7.17 3.25 12 3.25Zm0 1.5c-3.94 0-7.25 2.58-7.25 5.65 0 2.38.63 3.5 2.94 4.8a.75.75 0 0 1 .39.66l-.04 1.35 2.21-1.3a.75.75 0 0 1 .46-.1c.5.06 1 .1 1.29.1 3.94 0 7.25-2.58 7.25-5.65 0-3.07-3.31-5.65-7.25-5.65Z" />
    </svg>
  );
}
