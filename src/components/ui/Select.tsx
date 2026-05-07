import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string | number;
  label: React.ReactNode;
}

export interface SelectProps {
  value?: string | number;
  onChange?: (value: string | number) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Chọn giá trị...",
  disabled = false,
  className = "",
  size = "md",
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between border border-slate-200 bg-slate-50 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400 focus:border-[#245A34] focus:outline-none focus:ring-1 focus:ring-[#245A34] ${
          size === "sm"
            ? "h-8 rounded-lg px-2.5 text-xs"
            : "h-12 rounded-2xl px-4 text-sm"
        }`}
      >
        <span className={!selectedOption ? "text-slate-400" : ""}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""} ${
            size === "sm" ? "h-3 w-3 ml-1" : "h-4 w-4"
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-slate-100 bg-white py-2 shadow-lg">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm font-semibold text-slate-400">
              Không có dữ liệu
            </div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange?.(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex cursor-pointer items-center justify-between font-semibold transition-colors hover:bg-emerald-50 hover:text-[#245A34] ${
                    size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-3 text-sm"
                  } ${
                    isSelected
                      ? "bg-emerald-50/50 text-[#245A34]"
                      : "text-slate-700"
                  }`}
                >
                  {option.label}
                  {isSelected && <Check className="h-4 w-4 text-[#245A34]" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
