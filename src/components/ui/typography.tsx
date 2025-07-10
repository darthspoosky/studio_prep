import * as React from 'react';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: keyof typeof typography;
  as?: React.ElementType;
  gradient?: boolean;
  muted?: boolean;
  truncate?: boolean;
}

// Main Typography component
export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant = 'text-base', as, gradient, muted, truncate, children, ...props }, ref) => {
    const Component = as || getDefaultElement(variant);
    
    return (
      <Component
        ref={ref}
        className={cn(
          typography[variant],
          gradient && 'bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent',
          muted && 'text-muted-foreground',
          truncate && 'truncate',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Typography.displayName = 'Typography';

// Helper function to get default element for variant
function getDefaultElement(variant: keyof typeof typography): React.ElementType {
  if (variant.startsWith('display-') || variant.startsWith('h')) {
    const level = variant.replace('display-', '').replace('h', '');
    switch (level) {
      case '1': return 'h1';
      case '2': return 'h2';
      case '3': return 'h3';
      case '4': return 'h4';
      case '5': return 'h5';
      case '6': return 'h6';
      default: return 'h1';
    }
  }
  return 'p';
}

// Convenience components for common typography patterns
export const Heading = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ className, children, variant = 'h1', ...props }, ref) => (
    <Typography
      ref={ref}
      variant={variant}
      className={cn('scroll-m-20', className)}
      {...props}
    >
      {children}
    </Typography>
  )
);

Heading.displayName = 'Heading';

export const Text = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ className, children, variant = 'text-base', ...props }, ref) => (
    <Typography
      ref={ref}
      variant={variant}
      as="p"
      className={className}
      {...props}
    >
      {children}
    </Typography>
  )
);

Text.displayName = 'Text';

export const Caption = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, children, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="caption"
      as="span"
      className={className}
      {...props}
    >
      {children}
    </Typography>
  )
);

Caption.displayName = 'Caption';

export const Lead = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ className, children, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="lead"
      as="p"
      className={className}
      {...props}
    >
      {children}
    </Typography>
  )
);

Lead.displayName = 'Lead';

export const Mono = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, children, as = 'code', ...props }, ref) => (
    <Typography
      ref={ref}
      variant="mono"
      as={as}
      className={cn('bg-muted px-1.5 py-0.5 rounded-sm', className)}
      {...props}
    >
      {children}
    </Typography>
  )
);

Mono.displayName = 'Mono';

export const Overline = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, children, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="overline"
      as="span"
      className={className}
      {...props}
    >
      {children}
    </Typography>
  )
);

Overline.displayName = 'Overline';

// List components
export const List = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn('my-6 ml-6 list-disc', className)} {...props} />
  )
);

List.displayName = 'List';

export const ListItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn('mt-2', className)} {...props} />
  )
);

ListItem.displayName = 'ListItem';

export const OrderedList = React.forwardRef<HTMLOListElement, React.HTMLAttributes<HTMLOListElement>>(
  ({ className, ...props }, ref) => (
    <ol ref={ref} className={cn('my-6 ml-6 list-decimal', className)} {...props} />
  )
);

OrderedList.displayName = 'OrderedList';

// Quote component
export const Blockquote = React.forwardRef<HTMLQuoteElement, React.HTMLAttributes<HTMLQuoteElement>>(
  ({ className, ...props }, ref) => (
    <blockquote
      ref={ref}
      className={cn('mt-6 border-l-2 border-border pl-6 italic', className)}
      {...props}
    />
  )
);

Blockquote.displayName = 'Blockquote';

// Table components
export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="my-6 w-full overflow-y-auto">
      <table ref={ref} className={cn('w-full', className)} {...props} />
    </div>
  )
);

Table.displayName = 'Table';

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
  )
);

TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  )
);

TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={cn('border-b transition-colors hover:bg-muted/50', className)} {...props} />
  )
);

TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted-foreground',
        className
      )}
      {...props}
    />
  )
);

TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('p-4 align-middle', className)}
      {...props}
    />
  )
);

TableCell.displayName = 'TableCell';

// Keyboard shortcut display
export const Kbd = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <kbd
      ref={ref}
      className={cn(
        'pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100',
        className
      )}
      {...props}
    />
  )
);

Kbd.displayName = 'Kbd';

// Separator with text
export const SeparatorWithText = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { text: string }>(
  ({ className, text, ...props }, ref) => (
    <div ref={ref} className={cn('relative', className)} {...props}>
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">{text}</span>
      </div>
    </div>
  )
);

SeparatorWithText.displayName = 'SeparatorWithText';

// Highlight text
export const Highlight = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <mark
      ref={ref}
      className={cn('bg-yellow-200 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100', className)}
      {...props}
    />
  )
);

Highlight.displayName = 'Highlight';