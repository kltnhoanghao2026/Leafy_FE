import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalShellProps {
  onClose: () => void;
  children?: ReactNode;
  /** Content inside the icon badge next to the title */
  icon?: ReactNode;
  /** CSS class for the icon badge background. Default: "bg-[#245A34]/10" */
  iconBg?: string;
  /** Dialog title rendered in an h2 element */
  title?: ReactNode;
  /** id placed on the h2; also used as aria-labelledby on the dialog wrapper */
  titleId?: string;
  /** Content rendered below the title inside the header */
  subtitle?: ReactNode;
  /** Rendered above the header (e.g. decorative accent bar) */
  accentBar?: ReactNode;
  /** Content for the sticky footer wrapper */
  footer?: ReactNode;
  /** "bottom-sheet" slides up on mobile; "centered" is always centred. Default: "centered" */
  position?: "bottom-sheet" | "centered";
  /** Tailwind max-width class for the dialog container. Default: "sm:max-w-xl" */
  maxWidth?: string;
  /** Tailwind z-index class. Default: "z-50" */
  zIndex?: string;
  /** Tailwind class for the backdrop background. Default: "bg-slate-950/50" */
  backdropColor?: string;
  /** Show a mobile drag handle bar at the bottom */
  dragHandle?: boolean;
  /** Extra classes appended to the footer wrapper div */
  footerClassName?: string;
  /** Extra classes appended to the header wrapper div */
  headerClassName?: string;
  /** Extra classes appended to the inner white container div */
  className?: string;
}

export function ModalShell({
  onClose,
  children,
  icon,
  iconBg = "bg-[#245A34]/10",
  title,
  titleId,
  subtitle,
  accentBar,
  footer,
  position = "centered",
  maxWidth = "sm:max-w-xl",
  zIndex = "z-50",
  backdropColor = "bg-slate-950/50",
  dragHandle = false,
  footerClassName,
  headerClassName,
  className,
}: ModalShellProps) {
  const isBottomSheet = position === "bottom-sheet";
  const hasHeader = !!(icon || title);

  return (
    <div
      className={`fixed inset-0 ${zIndex} ${backdropColor} backdrop-blur-sm ${
        isBottomSheet
          ? "flex items-end justify-center sm:items-center p-0 sm:p-6"
          : "flex items-center justify-center p-4"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`flex w-full flex-col ${maxWidth} ${
          isBottomSheet ? "max-h-[95vh] sm:max-h-[88vh]" : "max-h-[92vh]"
        } ${
          isBottomSheet ? "rounded-t-3xl sm:rounded-3xl" : "rounded-2xl"
        } bg-white shadow-2xl overflow-hidden${className ? ` ${className}` : ""}`}
      >
        {accentBar ?? (
          <div className="h-1 w-full shrink-0 bg-linear-to-r from-[#245A34] to-emerald-400" />
        )}

        {hasHeader ? (
          <div
            className={`shrink-0 px-6 pt-5 pb-4 border-b border-slate-100${
              headerClassName ? ` ${headerClassName}` : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {icon && (
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}
                  >
                    {icon}
                  </span>
                )}
                {(title || subtitle) && (
                  <div>
                    {title && (
                      <h2
                        id={titleId}
                        className="text-lg font-black text-slate-900 leading-tight"
                      >
                        {title}
                      </h2>
                    )}
                    {subtitle}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="shrink-0 flex justify-end px-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {footer && (
          <div
            className={`shrink-0 border-t border-slate-100 px-6 py-4${
              footerClassName ? ` ${footerClassName}` : ""
            }`}
          >
            {footer}
          </div>
        )}

        {dragHandle && (
          <div className="sm:hidden shrink-0 flex justify-center pb-2 pt-0.5">
            <div className="h-1 w-10 rounded-full bg-slate-200" />
          </div>
        )}
      </div>
    </div>
  );
}
