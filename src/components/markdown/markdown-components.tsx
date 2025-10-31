import type {
  AnchorHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import type { Components } from "react-markdown";
import { cn } from "@/lib/utils";
import { defaultSchema } from "rehype-sanitize";
import type { Schema } from "hast-util-sanitize";

const additionalTags = [
  "u",
  "pre",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
];

const mergedTagNames = Array.from(
  new Set([...(defaultSchema.tagNames ?? []), ...additionalTags]),
);

export const markdownSanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: mergedTagNames,
};

type CodeProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode;
  inline?: boolean;
  node?: unknown;
};

const CodeRenderer = ({ className, children, inline, ...props }: CodeProps) => {
  const isInline = inline ?? !className;

  if (isInline) {
    return (
      <code
        {...props}
        className={cn("rounded bg-muted px-1 py-0.5 text-xs", className)}
      >
        {children}
      </code>
    );
  }

  return (
    <pre className="overflow-x-auto rounded-md bg-muted/60 px-4 py-3 text-sm text-foreground">
      <code
        {...props}
        className={cn("block font-mono text-xs leading-relaxed", className)}
      >
        {children}
      </code>
    </pre>
  );
};

export const automationMarkdownComponents = {
  p: ({
    className,
    children,
    ...props
  }: HTMLAttributes<HTMLParagraphElement>) => (
    <p
      {...props}
      className={cn("leading-relaxed text-foreground/90", className)}
    >
      {children}
    </p>
  ),
  a: ({
    className,
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      {...props}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "font-medium text-primary underline-offset-2 hover:underline",
        className,
      )}
    >
      {children}
    </a>
  ),
  code: CodeRenderer,
  ul: ({ className, children, ...props }: HTMLAttributes<HTMLUListElement>) => (
    <ul {...props} className={cn("ml-4 list-disc space-y-1", className)}>
      {children}
    </ul>
  ),
  ol: ({ className, children, ...props }: HTMLAttributes<HTMLOListElement>) => (
    <ol {...props} className={cn("ml-4 list-decimal space-y-1", className)}>
      {children}
    </ol>
  ),
  h2: ({
    className,
    children,
    ...props
  }: HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      {...props}
      className={cn("text-lg font-semibold text-foreground", className)}
    >
      {children}
    </h2>
  ),
  h3: ({
    className,
    children,
    ...props
  }: HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      {...props}
      className={cn("text-base font-semibold text-foreground", className)}
    >
      {children}
    </h3>
  ),
  u: ({ className, children, ...props }: HTMLAttributes<HTMLElement>) => (
    <u {...props} className={cn("underline underline-offset-2", className)}>
      {children}
    </u>
  ),
  table: ({
    className,
    children,
    ...props
  }: TableHTMLAttributes<HTMLTableElement>) => (
    <div className="w-full overflow-x-auto">
      <table
        {...props}
        className={cn(
          "w-full min-w-[24rem] table-auto border-collapse",
          className,
        )}
      >
        {children}
      </table>
    </div>
  ),
  th: ({
    className,
    children,
    ...props
  }: ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      {...props}
      className={cn(
        "border border-border bg-muted px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        className,
      )}
    >
      {children}
    </th>
  ),
  td: ({
    className,
    children,
    ...props
  }: TdHTMLAttributes<HTMLTableCellElement>) => (
    <td
      {...props}
      className={cn("border border-border px-3 py-2 text-sm", className)}
    >
      {children}
    </td>
  ),
  blockquote: ({
    className,
    children,
    ...props
  }: HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      {...props}
      className={cn(
        "border-l-2 border-border/70 pl-4 text-muted-foreground italic",
        className,
      )}
    >
      {children}
    </blockquote>
  ),
  hr: ({ className, ...props }: HTMLAttributes<HTMLHRElement>) => (
    <hr {...props} className={cn("border-muted", className)} />
  ),
} satisfies Components;
