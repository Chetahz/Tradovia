import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ variant = "secondary", className = "", ...props }: ButtonProps) {
  return <button className={`tv-button tv-button--${variant} ${className}`.trim()} {...props} />;
}
