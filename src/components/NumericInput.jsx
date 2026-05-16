import { useState } from "react";

/**
 * A text input that displays numbers with comma separators when not focused.
 * While typing, shows the raw value. On blur, formats as 1,000,000.
 * Compatible with existing onChange handlers that use e.target.value.
 */
export default function NumericInput({ value, onChange, onFocus, onBlur, className, ...props }) {
  const [focused, setFocused] = useState(false);

  const toDisplay = (v) => {
    if (v === "" || v === null || v === undefined) return "";
    const clean = String(v).replace(/,/g, "");
    const num = parseFloat(clean);
    if (isNaN(num)) return clean;
    // Preserve decimal portion as-is, only format integer part
    const [intPart, decPart] = clean.split(".");
    const formatted = parseInt(intPart || "0", 10).toLocaleString(undefined);
    return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
  };

  const rawValue = focused
    ? String(value ?? "").replace(/,/g, "")
    : toDisplay(value);

  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      value={rawValue}
      onChange={onChange}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      className={className}
    />
  );
}
