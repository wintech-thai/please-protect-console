"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

interface ModalContextValue {
  onClose: () => void;
}

const ModalContext = React.createContext<ModalContextValue>({
  onClose: () => {},
});

function useModalContext() {
  return React.useContext(ModalContext);
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal (root)
// ─────────────────────────────────────────────────────────────────────────────

interface ModalProps {
  /** Controls whether the modal is visible. */
  open: boolean;
  /** Called when the modal requests to be closed (backdrop click, ModalClose, Escape). */
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Root component. Manages body-scroll lock and provides the close handler to
 * all descendants via context.
 */
function Modal({ open, onClose, children }: ModalProps) {
  // Keyboard: close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Body scroll lock
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <ModalContext.Provider value={{ onClose }}>
      {children}
    </ModalContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ModalContent
// ─────────────────────────────────────────────────────────────────────────────

type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";

const sizeMap: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
};

interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Constrains the panel width. Defaults to `"lg"`.
   */
  size?: ModalSize;
  /**
   * When `true` (default), clicking the backdrop closes the modal.
   */
  closeOnBackdrop?: boolean;
}

/**
 * Renders the backdrop + panel via a React portal on `document.body`.
 * Pass `className` to customise the panel (e.g. a coloured border).
 *
 * @example
 * <ModalContent size="2xl" className="border-red-500/40">…</ModalContent>
 */
const ModalContent = React.forwardRef<HTMLDivElement, ModalContentProps>(
  (
    {
      size = "lg",
      closeOnBackdrop = true,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const { onClose } = useModalContext();

    // Guard against SSR: only mount the portal after hydration.
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return createPortal(
      <div
        className="fixed inset-0 z-100 flex items-center justify-center p-4 animate-in fade-in duration-200"
        // Allow the outer wrapper to capture backdrop clicks without
        // accidentally firing when clicking inside the panel.
        onMouseDown={(e) => {
          if (closeOnBackdrop && e.target === e.currentTarget) onClose();
        }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          aria-hidden="true"
        />

        {/* Panel */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          className={cn(
            "relative w-full max-h-[90vh] bg-[#0B1120] border border-slate-800 rounded-xl",
            "shadow-2xl shadow-black overflow-hidden flex flex-col",
            "animate-in slide-in-from-bottom-4 fade-in duration-200",
            sizeMap[size],
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </div>,
      document.body,
    );
  },
);
ModalContent.displayName = "ModalContent";

// ─────────────────────────────────────────────────────────────────────────────
// ModalHeader
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sticky header strip with a flex row that separates leading content from the
 * close button. Add a `ModalClose` anywhere inside and it naturally flows to
 * the right thanks to `justify-between`.
 */
const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative z-10 flex items-start justify-between gap-4",
      "p-6 pb-4 border-b border-slate-800 shrink-0",
      className,
    )}
    {...props}
  />
));
ModalHeader.displayName = "ModalHeader";

// ─────────────────────────────────────────────────────────────────────────────
// ModalTitle
// ─────────────────────────────────────────────────────────────────────────────

const ModalTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-bold text-white tracking-tight", className)}
    {...props}
  />
));
ModalTitle.displayName = "ModalTitle";

// ─────────────────────────────────────────────────────────────────────────────
// ModalDescription
// ─────────────────────────────────────────────────────────────────────────────

const ModalDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-slate-400 mt-1", className)}
    {...props}
  />
));
ModalDescription.displayName = "ModalDescription";

// ─────────────────────────────────────────────────────────────────────────────
// ModalBody
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scrollable content area that grows to fill available height.
 */
const ModalBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative z-10 flex-1 overflow-y-auto p-6", className)}
    {...props}
  />
));
ModalBody.displayName = "ModalBody";

// ─────────────────────────────────────────────────────────────────────────────
// ModalFooter
// ─────────────────────────────────────────────────────────────────────────────

const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-800 shrink-0",
      className,
    )}
    {...props}
  />
));
ModalFooter.displayName = "ModalFooter";

// ─────────────────────────────────────────────────────────────────────────────
// ModalClose
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Close button that reads `onClose` from context. Renders a default X icon
 * unless custom `children` are provided.
 *
 * @example
 * // Default X icon:
 * <ModalClose />
 * // Custom label:
 * <ModalClose>Cancel</ModalClose>
 */
const ModalClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, onClick, ...props }, ref) => {
  const { onClose } = useModalContext();
  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        onClose();
        onClick?.(e);
      }}
      className={cn(
        "shrink-0 rounded-full p-1.5 text-slate-400 hover:text-white",
        "hover:bg-white/5 transition-colors outline-none focus-visible:ring-2",
        "focus-visible:ring-orange-500/50",
        className,
      )}
      {...props}
    >
      {children ?? <X className="w-5 h-5" />}
      {!children && <span className="sr-only">Close</span>}
    </button>
  );
});
ModalClose.displayName = "ModalClose";

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalClose,
};
