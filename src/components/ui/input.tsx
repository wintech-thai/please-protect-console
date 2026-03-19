import * as React from "react";

import { cn } from "@/lib/utils";

function Input({
  className,
  type,
  label,
  errorMessage,
  helperText,
  isRequired,
  t,
  ...props
}: React.ComponentProps<"input"> & {
  isRequired?: boolean;
  label?: string;
  errorMessage?: string;
  helperText?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t?: any;
}) {
  const id = React.useId();

  return (
    <div className="*:not-first:mt-2 w-full">
      {label && (
        <label
          className={cn(
            "text-foreground text-sm leading-4 font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            isRequired && "after:content-['*'] after:ml-1 after:text-red-500"
          )}
          htmlFor={id}
        >
          {label}
        </label>
      )}

      <input
        id={id}
        type={type}
        data-slot="input"
        className={cn(
          "peer file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 h-10 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          errorMessage && "border-destructive",
          className
        )}
        onWheel={(e) => {
          if (type === "number") e.currentTarget.blur();
        }}
        {...props}
      />

      {errorMessage && (
        <p
          className="peer-aria-invalid:text-rose-500 mt-2 text-xs text-rose-500"
          role="alert"
          aria-live="polite"
        >
          {errorMessage}
        </p>
      )}

      {helperText && !errorMessage && (
        <p
          className="peer-aria-invalid:text-destructive mt-2 text-xs"
          role="alert"
          aria-live="polite"
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  isRequired?: boolean;
  helperText?: string;
  errorMessage?: string;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  floatingLabel?: boolean;
};

export { Input };
