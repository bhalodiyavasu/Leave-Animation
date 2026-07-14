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
import { Textarea } from "../ui/textarea";

export const isRequiredLabel = <span className="text-red-500 pt-1">*</span>;

interface InputFieldProps<TFormValues extends FieldValues> {
  control: Control<TFormValues>;
  name: Path<TFormValues>;
  label?: string;
  placeholder: string;
  isRequired?: boolean;
  className?: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

function InputTextArea<TFormValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  isRequired = false,
  className = "",
  onChange,
  disabled,
}: InputFieldProps<TFormValues>) {
  return (
    <FormField<TFormValues>
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && (
            <div className="flex flex-row gap-3">
              <FormLabel htmlFor={field.name} className="text-muted-foreground">
                {label} {isRequired ? isRequiredLabel : ""}
              </FormLabel>
            </div>
          )}
          <FormControl>
            <Textarea
              id={field.name}
              className={`resize-none focus-visible:ring-2 focus-visible:ring-inset ${className}`}
              placeholder={placeholder}
              disabled={disabled}
              {...field}
              onChange={(e) => {
                field.onChange(e);
                onChange?.(e);
              }}
            />
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default InputTextArea;
