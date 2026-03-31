import { ChevronDown } from "lucide-react";
import React from "react";

export interface SettingAccordionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  isActive: boolean;
  onToggle: (id: string) => void;
  isDarkMode: boolean;
  children: React.ReactNode;
}

export function SettingAccordion({
  id,
  title,
  icon,
  isActive,
  onToggle,
  isDarkMode,
  children,
}: SettingAccordionProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
        isActive
          ? isDarkMode
            ? "border-[#1677ff] bg-[#212735] shadow-sm"
            : "border-[#1677ff] bg-white shadow-sm"
          : isDarkMode
          ? "border-[#212735] bg-[#1d232e]"
          : "border-[#e3e7ef] bg-[#f8f9fc]"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(isActive ? "" : id)}
        className={`flex w-full items-center justify-between px-5 py-4 text-right ${
          isActive
            ? isDarkMode
              ? "text-white"
              : "text-[#1677ff]"
            : isDarkMode
            ? "text-[#8a93a5]"
            : "text-[#1f2532]"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              isActive
                ? "bg-[#1677ff] text-white"
                : isDarkMode
                ? "bg-[#252c3c] text-[#8a93a5]"
                : "bg-[#ebedf2] text-[#5b6373]"
            }`}
          >
            {icon}
          </div>
          <span className={`text-sm font-bold ${isActive ? "text-[#1677ff]" : ""}`}>
            {title}
          </span>
        </div>
        <ChevronDown
          size={18}
          className={`transition-transform duration-300 ${
            isActive ? "rotate-180" : "text-[#8a93a5]"
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
