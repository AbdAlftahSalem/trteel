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
      data-section={id}
      className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
        isActive
          ? isDarkMode
            ? "border-[#2eaec2] bg-[#122126] shadow-[0_10px_24px_rgba(7,22,25,0.5)]"
            : "border-[#0d8f5b] bg-white shadow-[0_10px_20px_rgba(13,143,91,0.12)]"
          : isDarkMode
          ? "border-[#1b3238] bg-[#0f1a1e] hover:border-[#24505a]"
          : "border-[#d7e2da] bg-[#f7fbf8] hover:border-[#bfd5c4]"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(isActive ? "" : id)}
        className={`flex w-full items-center justify-between px-5 py-4 text-right transition-colors ${
          isActive
            ? isDarkMode
              ? "text-white"
              : "text-[#0d8f5b]"
            : isDarkMode
            ? "text-[#9db0b5]"
            : "text-[#294039]"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              isActive
                ? isDarkMode
                  ? "bg-[#2eaec2] text-[#072126]"
                  : "bg-[#0d8f5b] text-white"
                : isDarkMode
                ? "bg-[#183038] text-[#9db0b5]"
                : "bg-[#e8efea] text-[#5b7169]"
            }`}
          >
            {icon}
          </div>
          <span className={`text-sm font-extrabold ${isActive ? (isDarkMode ? "text-[#6ed9eb]" : "text-[#0d8f5b]") : ""}`}>
            {title}
          </span>
        </div>
        <ChevronDown
          size={18}
          className={`transition-transform duration-300 ${
            isActive ? "rotate-180" : isDarkMode ? "text-[#82979c]" : "text-[#7d9188]"
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
