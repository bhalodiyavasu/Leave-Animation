"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Control, FieldValues, Path } from "react-hook-form";

type CommonProps = {
  label?: string;
  isRequired?: boolean;
  disabled?: boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  error?: string;
};

type ControlledProps<T extends FieldValues> = CommonProps & {
  control: Control<T>;
  name: Path<T>;
  value?: never;
  onChange?: never;
};

type UncontrolledProps = CommonProps & {
  value: Date | string | null;
  onChange: (date: string | null) => void;
  control?: never;
  name?: string;
};

type DateInputProps<T extends FieldValues = FieldValues> =
  | ControlledProps<T>
  | UncontrolledProps;

const DateInput = <T extends FieldValues = FieldValues>(
  props: DateInputProps<T>,
) => {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>();
  const inputRef = useRef<HTMLInputElement>(null);

  const renderDateInput = (
    value: string | null,
    onChange: (date: string | null) => void,
    error?: string,
  ) => {
    const parsedDate = value ? new Date(value) : null;
    const formattedDate = parsedDate ? format(parsedDate, "dd-MM-yyyy") : "";

    // Sync input element's native value with outer prop changes (e.g. form reset, parent changes) when not active
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.value = formattedDate;
    }

    const isDateDisabled = (date: Date) => {
      if (props.minDate) {
        const dateToCheck = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        );
        const minDateToCheck = new Date(
          props.minDate.getFullYear(),
          props.minDate.getMonth(),
          props.minDate.getDate(),
        );
        if (dateToCheck < minDateToCheck) {
          return true;
        }
      }
      if (props.maxDate) {
        const dateToCheck = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        );
        const maxDateToCheck = new Date(
          props.maxDate.getFullYear(),
          props.maxDate.getMonth(),
          props.maxDate.getDate(),
        );
        if (dateToCheck > maxDateToCheck) {
          return true;
        }
      }
      return false;
    };

    return (
      <div className="flex flex-col gap-1 relative">
        <Popover open={open} onOpenChange={(val) => {
          setOpen(val);
          if (val) setMonth(parsedDate ?? undefined);
        }}>
          <PopoverTrigger asChild>
            <div className="relative w-full">
              <input
                ref={inputRef}
                type="text"
                disabled={props.disabled}
                defaultValue={formattedDate}
                placeholder="DD-MM-YYYY"
                onFocus={() => {
                  if (!props.disabled) {
                    setOpen(true);
                    setMonth(parsedDate ?? undefined);
                  }
                }}
                onClick={(e) => {
                  if (open) {
                    e.stopPropagation();
                  } else if (!props.disabled) {
                    setOpen(true);
                    setMonth(parsedDate ?? undefined);
                  }
                }}
                onChange={(e) => {
                  const input = e.target;
                  const originalVal = input.value;
                  const start = input.selectionStart || 0;

                  const val = originalVal.replace(/\D/g, "").slice(0, 8);
                  const formatted = val.length > 4 ? `${val.slice(0, 2)}-${val.slice(2, 4)}-${val.slice(4)}` :
                    val.length > 2 ? `${val.slice(0, 2)}-${val.slice(2)}` : val;
                  input.value = formatted;

                  // Keep cursor in place during editing
                  const newPos = start + (formatted.length - originalVal.length);
                  input.setSelectionRange(newPos, newPos);

                  if (formatted.length === 10) {
                    const parts = formatted.split("-");
                    const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                    if (!isNaN(date.getTime()) && date.getDate() === parseInt(parts[0], 10)) {
                      onChange(date.toISOString());
                      setMonth(date);
                    }
                  } else if (formatted === "") {
                    onChange(null);
                  }
                }}
                onBlur={(e) => {
                  const val = e.target.value;
                  const parts = val.split("-");
                  const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                  const isValid = parts.length === 3 && parts[2].length === 4 && !isNaN(date.getTime()) && date.getDate() === parseInt(parts[0], 10);
                  if (!isValid && val !== "") {
                    e.target.value = formattedDate;
                  }
                }}
                className={cn(
                  "w-full h-9 pl-3 pr-10 text-left font-normal rounded-md flex items-center justify-between",
                  "bg-background border border-input text-sm text-foreground outline-none transition-[color,box-shadow]",
                  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:ring-inset",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  error && "!border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 focus-visible:ring-2 focus-visible:ring-inset",
                  props.className,
                )}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!props.disabled) {
                    setOpen(!open);
                    if (!open) setMonth(parsedDate ?? undefined);
                  }
                }}
                disabled={props.disabled}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 hover:opacity-100 disabled:opacity-30 flex items-center justify-center cursor-pointer bg-transparent border-0"
              >
                <CalendarIcon className="h-4 w-4" />
              </button>
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 z-50"
            align="start"
            sideOffset={5}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Calendar
              mode="single"
              selected={parsedDate ?? undefined}
              month={month ?? parsedDate ?? undefined}
              onMonthChange={setMonth}
              onSelect={(date) => {
                if (date) {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const day = String(date.getDate()).padStart(2, "0");
                  const localDateString = `${year}-${month}-${day}`;
                  const ISODate = new Date(localDateString).toISOString();
                  onChange(ISODate);
                  // Update input DOM value directly
                  if (inputRef.current) {
                    inputRef.current.value = `${day}-${month}-${year}`;
                  }
                } else {
                  onChange(null);
                  if (inputRef.current) {
                    inputRef.current.value = "";
                  }
                }
                setOpen(false);
              }}
              disabled={isDateDisabled}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {/* This code block is only for autofill in chrome browser this is not loggical part */}
        <input
          type="date"
          value={parsedDate ? format(parsedDate, "yyyy-MM-dd") : ""}
          onChange={(e) => {
            const val = e.target.value;
            if (val) {
              onChange(new Date(val).toISOString());
            } else {
              onChange(null);
            }
          }}
          autoComplete="bday"
          className="absolute inset-0 opacity-0 pointer-events-none"
        />
        {/* ===================== */}
      </div>
    );
  };

  if ("control" in props && props.control && props.name) {
    const { control, name, label, isRequired } = props;

    return (
      <FormField
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <FormItem>
            {label && (
              <FormLabel htmlFor={field.name} className="text-muted-foreground">
                {label} {isRequired && <span className="text-red-500">*</span>}
              </FormLabel>
            )}
            <FormControl>
              {renderDateInput(
                field.value,
                field.onChange,
                fieldState.error?.message,
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  const { value, onChange, label, isRequired } = props;

  if (!onChange) {
    throw new Error("DateInput: onChange is required for uncontrolled usage");
  }

  const stringValue =
    value instanceof Date ? value.toISOString() : (value ?? null);

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          className={cn(
            "text-sm leading-none font-medium text-muted-foreground",
            props.error && "text-destructive",
          )}
        >
          {label} {isRequired && <span className="text-destructive">*</span>}
        </label>
      )}
      {renderDateInput(stringValue, onChange, props.error)}
      {props.error && (
        <p className="text-destructive text-sm">{props.error}</p>
      )}
    </div>
  );
};

export default DateInput;
