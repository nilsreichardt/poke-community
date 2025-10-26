"use client";

import {
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import type { Pluggable, PluggableList } from "unified";
import {
  Bold,
  Heading1,
  Italic,
  List,
  Underline,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  automationMarkdownComponents,
  markdownSanitizeSchema,
} from "@/components/markdown/markdown-components";

type BaseTextareaProps = ComponentPropsWithoutRef<typeof Textarea>;

type MarkdownEditorProps = Omit<BaseTextareaProps, "value" | "defaultValue"> & {
  value?: string;
  defaultValue?: string;
  previewEmptyLabel?: string;
};

type EditorMode = "edit" | "preview";

const remarkPlugins: PluggableList = [remarkGfm, remarkBreaks];
const sanitizePlugin: Pluggable = [rehypeSanitize, markdownSanitizeSchema];
const rehypePlugins: PluggableList = [rehypeRaw, sanitizePlugin];

export function MarkdownEditor({
  className,
  value,
  defaultValue,
  rows,
  previewEmptyLabel = "Nothing to preview yet.",
  ...props
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [mode, setMode] = useState<EditorMode>("edit");
  const currentValue =
    value ??
    textareaRef.current?.value ??
    (defaultValue ?? "");

  const previewMinHeight = useMemo(() => {
    const parsedRows =
      typeof rows === "number"
        ? rows
        : typeof rows === "string"
          ? Number.parseInt(rows, 10)
          : undefined;
    const baseRows = parsedRows && parsedRows > 0 ? parsedRows : 8;
    return baseRows * 24;
  }, [rows]);

  const wrapSelection = (before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.focus();
    const { selectionStart, selectionEnd, value: existingValue } = textarea;
    const hasSelection = selectionStart !== selectionEnd;
    const selectedText = existingValue.slice(selectionStart, selectionEnd);
    const replacement = `${before}${selectedText}${after}`;
    textarea.setRangeText(
      replacement,
      selectionStart,
      selectionEnd,
      "preserve"
    );
    triggerInput();
    const nextStart = selectionStart + before.length;
    const nextEnd = hasSelection
      ? nextStart + selectedText.length
      : nextStart;
    requestAnimationFrame(() => {
      textarea.setSelectionRange(nextStart, nextEnd);
    });
  };

  const applyList = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.focus();
    const { selectionStart, selectionEnd, value: existingValue } = textarea;
    const selectedText = existingValue.slice(selectionStart, selectionEnd);
    const lines = selectedText ? selectedText.split("\n") : [""];

    const formatted = lines
      .map((line) => {
        if (!line.trim().length) {
          return "- ";
        }

        if (/^\s*[-*+]\s/.test(line)) {
          return line;
        }

        return `- ${line.replace(/^\s*/, "")}`;
      })
      .join("\n");

    textarea.setRangeText(formatted, selectionStart, selectionEnd, "start");
    triggerInput();
    requestAnimationFrame(() => {
      if (selectedText) {
        textarea.setSelectionRange(
          selectionStart,
          selectionStart + formatted.length
        );
      } else {
        const cursor = selectionStart + formatted.length;
        textarea.setSelectionRange(cursor, cursor);
      }
    });
  };

  const applyHeading = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.focus();
    const { selectionStart, selectionEnd, value: existingValue } = textarea;

    if (selectionStart === selectionEnd) {
      const lineStart = existingValue.lastIndexOf("\n", selectionStart - 1) + 1;
      const lineEnd = existingValue.indexOf("\n", selectionStart);
      const resolvedLineEnd = lineEnd === -1 ? existingValue.length : lineEnd;
      const line = existingValue.slice(lineStart, resolvedLineEnd);
      const leadingSpaces = line.length - line.trimStart().length;
      const normalized = line.trimStart().startsWith("# ")
        ? line
        : `${line.slice(0, leadingSpaces)}# ${line.slice(leadingSpaces)}`;
      textarea.setRangeText(
        normalized,
        lineStart,
        resolvedLineEnd,
        "start"
      );
      triggerInput();
      requestAnimationFrame(() => {
        const caret = selectionStart + 2;
        textarea.setSelectionRange(caret, caret);
      });
      return;
    }

    const selectedText = existingValue.slice(selectionStart, selectionEnd);
    const formatted = selectedText
      .split("\n")
      .map((line) => {
        if (!line.trim().length) {
          return "# ";
        }
        if (/^\s*#\s/.test(line)) {
          return line;
        }
        return `# ${line.replace(/^\s*/, "")}`;
      })
      .join("\n");

    textarea.setRangeText(formatted, selectionStart, selectionEnd, "start");
    triggerInput();
    requestAnimationFrame(() => {
      textarea.setSelectionRange(
        selectionStart,
        selectionStart + formatted.length
      );
    });
  };

  const triggerInput = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    const event = new Event("input", { bubbles: true });
    textarea.dispatchEvent(event);
  };

  const toolbarActions = [
    {
      key: "bold",
      icon: Bold,
      label: "Bold",
      action: () => wrapSelection("**", "**"),
    },
    {
      key: "italic",
      icon: Italic,
      label: "Italic",
      action: () => wrapSelection("*", "*"),
    },
    {
      key: "underline",
      icon: Underline,
      label: "Underline",
      action: () => wrapSelection("<u>", "</u>"),
    },
    {
      key: "heading",
      icon: Heading1,
      label: "Heading",
      action: applyHeading,
    },
    {
      key: "list",
      icon: List,
      label: "Bulleted list",
      action: applyList,
    },
  ] as const;

  return (
    <div className="rounded-md border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/60 px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          {toolbarActions.map(({ key, icon: Icon, label, action }) => (
            <Button
              key={key}
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label={label}
              title={label}
              onMouseDown={(event) => {
                event.preventDefault();
                action();
              }}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <TabButton
            active={mode === "edit"}
            onClick={() => {
              setMode("edit");
              textareaRef.current?.focus();
            }}
          >
            Write
          </TabButton>
          <TabButton
            active={mode === "preview"}
            onClick={() => setMode("preview")}
          >
            Preview
          </TabButton>
        </div>
      </div>
      <div className="relative">
        <Textarea
          ref={textareaRef}
          rows={rows}
          className={cn(
            "min-h-0 resize-y rounded-b-md border-0 bg-transparent shadow-none focus-visible:border-0 focus-visible:ring-0",
            mode === "preview" ? "hidden" : "",
            className
          )}
          {...props}
          {...(value !== undefined
            ? { value }
            : defaultValue !== undefined
              ? { defaultValue }
              : {})}
        />
        {mode === "preview" ? (
          <div
            className={cn(
              "rounded-b-md bg-background px-3 py-3 text-sm leading-relaxed text-foreground space-y-4"
            )}
            style={{ minHeight: previewMinHeight }}
          >
            {currentValue.trim().length ? (
              <ReactMarkdown
                remarkPlugins={remarkPlugins}
                rehypePlugins={rehypePlugins}
                components={automationMarkdownComponents}
              >
                {currentValue}
              </ReactMarkdown>
            ) : (
              <p className="text-muted-foreground">{previewEmptyLabel}</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
        active
          ? "border border-border bg-background text-foreground shadow-xs"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
