import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: "light" | "dark"; // Keeping the prop for backwards compatibility but we won't need it internally
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type, variant, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="w-full">
        {label && (
          <label className={cn(
            "block text-sm font-medium mb-1.5",
            "text-slate-700 dark:text-slate-300"
          )}>
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={cn(
              "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 shadow-sm",
              "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500",
              error ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500/50" : "",
              isPassword ? "pr-10" : "",
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center justify-center"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
