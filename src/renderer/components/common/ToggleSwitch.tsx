import clsx from "clsx";

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "green" | "blue" | "purple" | "red" | "orange";
  className?: string;
  ariaLabel?: string;
}

export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  size = "md",
  color = "primary",
  className,
  ariaLabel,
}: ToggleSwitchProps) {
  const sizeClasses = {
    sm: "w-8 h-5",
    md: "w-11 h-6",
    lg: "w-14 h-7",
  };

  const knobSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const knobTranslateClasses = {
    sm: "peer-checked:translate-x-3",
    md: "peer-checked:translate-x-5",
    lg: "peer-checked:translate-x-7",
  };

  const colorClasses = {
    primary: "peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500 peer-focus:ring-primary-500",
    green: "peer-checked:bg-green-600 dark:peer-checked:bg-green-500 peer-focus:ring-green-500",
    blue: "peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 peer-focus:ring-blue-500",
    purple: "peer-checked:bg-purple-600 dark:peer-checked:bg-purple-500 peer-focus:ring-purple-500",
    red: "peer-checked:bg-red-600 dark:peer-checked:bg-red-500 peer-focus:ring-red-500",
    orange: "peer-checked:bg-orange-600 dark:peer-checked:bg-orange-500 peer-focus:ring-orange-500",
  };

  return (
    <label
      className={clsx("relative inline-flex items-center cursor-pointer", disabled && "opacity-50 cursor-not-allowed", className)}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
        aria-label={ariaLabel}
        aria-checked={checked}
      />
      <div
        className={clsx(
          sizeClasses[size],
          "bg-gray-200 rounded-full peer-focus:ring-2 dark:bg-gray-600 transition-colors",
          colorClasses[color]
        )}
      />
      <span
        className={clsx(
          knobSizeClasses[size],
          "absolute left-0.5 top-0.5 bg-white rounded-full shadow transform transition",
          knobTranslateClasses[size]
        )}
      />
    </label>
  );
}
