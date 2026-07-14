"use client";


import React, { ReactNode, useState } from "react";
import { Control, FieldValues, Path, ControllerRenderProps, ControllerFieldState } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

export const isRequiredLabel = <span className="text-red-500">*</span>;

interface InputFieldProps<TFormValues extends FieldValues> {
  control?: Control<TFormValues>;
  name?: Path<TFormValues>;
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
  className?: string;
  type?: string;
  value?: string | number;
  isLabelWithText?: boolean;
  disabled?: boolean;
  textAfterLabel?: ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hideInput?: boolean;
  step?: string | number;
  min?: number | string;
  max?: number | string;
  integerOnly?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBeforeInput?: (e: React.FormEvent<HTMLInputElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  maxLength?: number;
  toUpperCase?: boolean;
}

function InputField<TFormValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  isRequired = false,
  className = "",
  type,
  value,
  onChange,
  isLabelWithText = false,
  disabled = false,
  textAfterLabel,
  hideInput = false,
  step,
  min,
  max,
  integerOnly = false,
  onKeyDown,
  onBeforeInput,
  onPaste,
  maxLength,
  toUpperCase = false,
}: InputFieldProps<TFormValues>) {
  const [showPassword, setShowPassword] = useState(false);
  const isNewPassword = name === "newPassword";

  const renderInput = (fieldProps?: ControllerRenderProps<TFormValues, Path<TFormValues>>, fieldState?: ControllerFieldState) => {
    if (hideInput) return null;
    const inputType =
      type === "password"
        ? showPassword
          ? "text"
          : "password"
        : type || "text";

    const isNumber = type === "number";
    const fieldValue = fieldProps?.value ?? value ?? "";
    const resolvedValue =
      isNumber &&
      min !== undefined &&
      fieldValue !== undefined &&
      fieldValue !== ""
        ? Math.max(Number(fieldValue), Number(min))
        : fieldValue;

    return (
      <div className="relative">
        <Input
          id={fieldProps?.name || name}
          className={`h-9 ${className} ${
            isNumber ? "hide-number-arrows" : ""
          } ${
            type === "time"
              ? "[&::-webkit-calendar-picker-indicator]:size-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              : ""
          } ${
            disabled
              ? "disabled:opacity-50 disabled:text-foreground disabled:bg-muted disabled:cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
              : " focus-visible:ring-2 focus-visible:ring-inset"
          }`}
          placeholder={placeholder}
          type={inputType}
          aria-invalid={!!fieldState?.error}
          {...(fieldProps
            ? { ...fieldProps, value: resolvedValue }
            : {
                value: resolvedValue,
                onChange,
              })}
          {...(isNumber && step !== undefined ? { step } : {})}
          {...(min !== undefined ? { min } : isNumber ? { min: 0 } : {})}
          {...(max !== undefined ? { max } : {})}
          {...(maxLength !== undefined ? { maxLength } : {})}
          onKeyDown={(e) => {
            if (integerOnly && (e.key === "." || e.key === ",")) {
              e.preventDefault();
            }
            if (isNumber && e.key === "-" && (min === undefined || Number(min) >= 0)) {
              e.preventDefault();
            }
            onKeyDown?.(e);
          }}
          onBeforeInput={onBeforeInput}
          onFocus={(e) => isNumber && e.target.select()}
          onChange={(e) => {
            if (isNumber) {
              e.target.value = e.target.value.replace(/^0+(?=\d)/, "");
            }
            if (isNumber && step === "1") {
              e.target.value = e.target.value.replace(/[.,].*/g, "");
            }
            if (maxLength !== undefined && e.target.value.length > maxLength) {
              e.target.value = e.target.value.slice(0, maxLength);
            }
            if (toUpperCase) {
              e.target.value = e.target.value.toUpperCase();
            }
            fieldProps?.onChange?.(e);
            onChange?.(e);
          }}
          onPaste={onPaste}
          disabled={disabled}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    );
  };

  if (control && name) {
    return (
      <FormField<TFormValues>
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <FormItem>
            {isLabelWithText ? (
              <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-3 items-center">
                  <FormLabel
                    htmlFor={field.name}
                    className="text-muted-foreground"
                  >
                    {label} {isRequired ? isRequiredLabel : ""}
                  </FormLabel>
                  {hideInput ? <FormMessage /> : null}
                </div>
                {textAfterLabel}
              </div>
            ) : (
              <div className="flex flex-row gap-3">
                <FormLabel
                  htmlFor={field.name}
                  className="text-muted-foreground"
                >
                  {label} {isRequired ? isRequiredLabel : ""}
                </FormLabel>
              </div>
            )}
            <FormControl>{renderInput(field, fieldState)}</FormControl>
            {isNewPassword && (
              <i className="pt-[-20px] text-xs leading-tight text-gray-500">
                Password must contain 1 number, 1 special character, 1 lowercase
                letter, 1 uppercase letter, and be at least 10 characters long.
              </i>
            )}
            {!hideInput ? <FormMessage /> : null}
          </FormItem>
        )}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 gap-1">
      <label
        htmlFor={name}
        className="text-sm font-medium text-muted-foreground dark:text-muted-foreground"
      >
        {label} {isRequired ? isRequiredLabel : ""}
      </label>
      {!hideInput && renderInput()}
      {isNewPassword && (
        <i className="pt-[-20px] text-xs leading-tight text-gray-500">
          Password must contain 1 number, 1 special character, 1 lowercase
          letter, 1 uppercase letter, and be at least 10 characters long.
        </i>
      )}
    </div>
  );
}

export default InputField;
