"use client";

import { type ReactNode } from "react";

export function HorizontalScrollTabs({
  children,
  className = "",
  sticky = false,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  sticky?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div
      className={`relative ${sticky ? "sticky top-[53px] z-20 -mx-4 bg-slate-50/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-slate-50/90 lg:static lg:mx-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none" : ""} ${className}`}
    >
      <div
        className="overflow-x-auto pb-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label={ariaLabel}
      >
        <div className="inline-flex min-w-max snap-x snap-mandatory gap-1.5">
          {children}
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-slate-50 to-transparent lg:hidden"
        aria-hidden
      />
    </div>
  );
}

export function HorizontalTab({
  active,
  children,
  className = "",
  ...props
}: {
  active: boolean;
  children: ReactNode;
  className?: string;
} & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`snap-start whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition-colors active:scale-[0.98] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function HorizontalTabLink({
  active,
  children,
  className = "",
  ...props
}: {
  active: boolean;
  children: ReactNode;
  className?: string;
} & React.ComponentProps<"a">) {
  return (
    <a
      role="tab"
      aria-selected={active}
      className={`snap-start whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition-colors active:scale-[0.98] ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
