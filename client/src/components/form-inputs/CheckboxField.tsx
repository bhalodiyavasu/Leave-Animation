"use client";

import React from "react";
import { Control, FieldValues, Path } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

interface CheckboxFieldProps<TFormValues extends FieldValues> {
  control?: Control<TFormValues>;
  name?: Path<TFormValues>;
  label: string;
  checked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

function CheckboxField<TFormValues extends FieldValues>({
  control,
  name,
  label,
  checked,
  disabled = false,
  onCheckedChange,
  className = "",
}: CheckboxFieldProps<TFormValues>) {
  if (control && name) {
    return (
      <FormField<TFormValues>
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem
            className={`flex flex-row items-center gap-2 space-y-0 ${className}`}
          >
            <FormControl>
              <Checkbox
                id={field.name}
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
            <FormLabel
              htmlFor={field.name}
              className="cursor-pointer font-normal text-muted-foreground"
            >
              {label}
            </FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Checkbox
        id={name || label.toLowerCase().replace(/\s+/g, "N/A")}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
      <label
        htmlFor={name || label.toLowerCase().replace(/\s+/g, "N/A")}
        className="text-sm font-medium cursor-pointer"
      >
        {label}
      </label>
    </div>
  );
}

export default CheckboxField;
