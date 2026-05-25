import React from "react";

export interface AdminTab<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

export interface AdminTabsProps<T extends string = string> {
  tabs: AdminTab<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
}

export function AdminTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = "",
}: AdminTabsProps<T>) {
  return (
    <div className={`flex items-center gap-1 border-b border-slate-200 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors rounded-t-lg border-b-2 -mb-px ${
            activeTab === tab.id
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/60"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
