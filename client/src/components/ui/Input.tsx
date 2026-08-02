import React from "react";
import { cn } from "../../lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: "light" | "dark";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, variant = "light", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className={cn(
            "block text-sm font-medium mb-1.5",
            variant === "dark" ? "text-slate-300" : "text-slate-700"
          )}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 shadow-sm",
            variant === "dark" 
              ? "bg-slate-900/50 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
              : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500",
            error && (variant === "dark" ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : "border-red-500 focus:border-red-500 focus:ring-red-500"),
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
