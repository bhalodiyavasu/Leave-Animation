"use client";

import React, { useState } from "react";
import {
  Control,
  FieldValues,
  Path,
  useFormContext,
  PathValue,
} from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { isRequiredLabel } from "./InputField";
import SelectInput from "./SelectInput";
import { Input } from "@/components/ui/input";

import { cn } from "@/lib/utils";

interface ArrayInputFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  isRequired?: boolean;
  disabled?: boolean;
  isSelectInput?: boolean;
  options?: { value: string; name: string }[];
  itemBadges?: Record<string, React.ReactNode>;
}

const ArrayInputField = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  isRequired = false,
  disabled = false,
  isSelectInput = false,
  options = [],
  itemBadges = {},
}: ArrayInputFieldProps<T>) => {
  const [newValue, setNewValue] = useState("");
  const [selectKey, setSelectKey] = useState(0);
  const { setValue, getValues, watch } = useFormContext<T>();

  const items = watch(name) || [];

  const handleAddField = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (newValue.trim()) {
      const currentValues = getValues(name) || [];
      setValue(name, [...currentValues, newValue.trim()] as PathValue<
        T,
        Path<T>
      >, { shouldValidate: true });
      setNewValue("");
      setSelectKey((k) => k + 1);
    }
  };

  const handleRemoveField = (index: number) => {
    const currentValues = getValues(name) || [];
    setValue(
      name,
      currentValues.filter((_: unknown, i: number) => i !== index) as PathValue<
        T,
        Path<T>
      >,
      { shouldValidate: true },
    );
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ fieldState }) => (
        <FormItem className="space-y-1">
          <FormLabel className="text-muted-foreground">
            {label} {isRequired ? isRequiredLabel : ""}
          </FormLabel>
          <FormControl>
            <div className="space-y-3">
              <div className="flex gap-2">
                {isSelectInput ? (
                  (() => {
                    const remainingOptions = options.filter((opt) => !(items as string[]).includes(opt.value));
                    if (remainingOptions.length === 0 && options.length > 0) {
                      return (
                        <p className="flex-1 text-xs text-muted-foreground italic self-center pl-1">
                          All options selected.
                        </p>
                      );
                    }
                    return (
                      <SelectInput
                        key={selectKey}
                        value={newValue}
                        onChange={(val) => setNewValue(String(val))}
                        name="array-select-input"
                        placeholder={placeholder || "Select an option"}
                        options={remainingOptions}
                        hideLabel={true}
                        className="h-9"
                        disabled={disabled}
                        error={!!fieldState.error}
                      />
                    );
                  })()
                ) : (
                  <Input
                    placeholder={placeholder}
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddField(e);
                      }
                    }}
                    disabled={disabled}
                    aria-invalid={!!fieldState.error}
                  />
                )}
                {(!isSelectInput || disabled || options.filter((opt) => !(items as string[]).includes(opt.value)).length > 0) && (
                  <Button
                    type="button"
                    variant="default"
                    size="icon"
                    onClick={handleAddField}
                    disabled={disabled || !newValue.trim()}
                  >
                    <Plus size={18} />
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {items.map((item: string, index: number) => (
                  <div
                    key={`${item}-${index}`}
                    className="flex items-stretch bg-secondary/50 rounded-md text-sm border border-border max-w-full"
                  >
                    <span className="px-3 py-1.5 border-r break-words flex-1 min-w-0" style={{ wordBreak: 'break-word' }}>
                      {isSelectInput
                        ? (options.find((opt) => opt.value === item)?.name ?? item)
                        : item}
                      {itemBadges[item]}
                    </span>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => handleRemoveField(index)}
                        className="w-8 h-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors hover:bg-red-500/10"
                      >
                        <X size={15} className="-mt-[2px]" />
                      </button>
                    )}
                  </div>
                ))}
                {items.length === 0 && (
                  <span className="text-xs text-muted-foreground italic pl-1">
                    No items added yet.
                  </span>
                )}
              </div>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ArrayInputField;
