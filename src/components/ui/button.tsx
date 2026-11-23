import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "default";

const variants: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-accent-hover",
  secondary: "bg-muted text-foreground hover:bg-muted/70",
  outline: "border border-input bg-transparent text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
  danger: "bg-danger text-danger-foreground hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "min-h-10 px-3 py-2 text-xs",
  default: "min-h-11 px-4 py-2",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

const buttonClasses = (variant: Variant, size: Size, className?: string) =>
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", asChild = false, ...props }, ref) => {
    const classes = buttonClasses(variant, size, className);
    if (asChild) {
      return <Slot ref={ref} className={classes} {...props} />;
    }
    return <button type={type} ref={ref} className={classes} {...props} />;
  },
);
Button.displayName = "Button";
