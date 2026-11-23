"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, getStatusVariant } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StatusSelectProps {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void | Promise<void>;
  ariaLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  triggerClassName?: string;
}

/** Tag colorida clicável, no estilo Notion, para alternar estados. */
export function StatusSelect({
  value,
  options,
  onChange,
  ariaLabel,
  disabled,
  loading,
  className,
  triggerClassName,
}: StatusSelectProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel ?? `Alterar status: ${value}`}
          disabled={disabled || loading}
          className={cn(
            "inline-flex max-w-full items-center rounded-md outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <Badge
            variant={getStatusVariant(value)}
            className={cn("gap-1 border-transparent px-2 py-1", triggerClassName)}
          >
            <span className="truncate">{value}</span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[11rem]">
        {options.map((option) => {
          const active = option === value;
          return (
            <DropdownMenuItem
              key={option}
              onSelect={() => void onChange(option)}
              className="justify-between gap-3"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <Badge
                variant={getStatusVariant(option)}
                className={cn("border-transparent", active && "ring-1 ring-primary")}
              >
                {option}
              </Badge>
              {active && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
