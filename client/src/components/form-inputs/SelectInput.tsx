"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDownIcon, X } from "lucide-react";
import { useRef, useState } from "react";
import { Control, FieldValues, Path } from "react-hook-form";
import { isRequiredLabel } from "./InputField";

interface OptionItem {
  name: string;
  value: string | number;
  [key: string]: unknown;
}

interface OptionGroup {
  name: string;
  data: OptionItem[];
}

export type SelectOption = OptionItem | OptionGroup;

const isOptionGroup = (opt: SelectOption): opt is OptionGroup => "data" in opt;

type BaseProps = {
  label?: string;
  placeholder: string;
  options: SelectOption[];
  hideLabel?: boolean;
  isRequired?: boolean;
  className?: string;
  disabled?: boolean;
  isSearchable?: boolean;
  optionsMinWidth?: string;
  isClearable?: boolean;
};

type WithForm<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  onChange?: (value: string | number) => void;
};

type WithoutForm = {
  value: string | number;
  onChange: (value: string | number) => void;
  name: string;
  error?: string | boolean;
};

type SelectInputProps<T extends FieldValues> = BaseProps &
  (WithForm<T> | WithoutForm);

export default function SelectInput<T extends FieldValues>(
  props: SelectInputProps<T>,
) {
  const {
    label,
    placeholder,
    options = [],
    hideLabel,
    isRequired,
    className,
    disabled,
    isSearchable,
    optionsMinWidth,
    isClearable,
  } = props;

  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const flattenedOptions = options.flatMap((opt) =>
    isOptionGroup(opt) ? opt.data : [opt],
  );

  const filteredOptions: SelectOption[] =
    isSearchable && search
      ? options.reduce<SelectOption[]>((acc, opt) => {
          if (isOptionGroup(opt)) {
            const filtered = opt.data.filter((item) =>
              item.name.toLowerCase().includes(search.toLowerCase()),
            );
            if (filtered.length) acc.push({ ...opt, data: filtered });
          } else if (opt.name.toLowerCase().includes(search.toLowerCase())) {
            acc.push(opt);
          }
          return acc;
        }, [])
      : options;

  const renderSearchInput = () =>
    isSearchable ? (
      <div className="sticky top-0 z-10 bg-popover px-1.5 py-1.5 border-b">
        <input
          ref={searchRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full h-9 rounded-sm border border-input bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          onKeyDown={(e) => e.stopPropagation()}
        />
      </div>
    ) : null;

  const renderOptions = (
    currentValue: string | undefined,
    onSelect: (v: string | number) => void,
  ) => {
    if (filteredOptions.length === 0) {
      return (
        <div className="py-3 text-center text-sm text-muted-foreground">
          No data found
        </div>
      );
    }
    return filteredOptions.map((option, index) => {
      const isLast = index === filteredOptions.length - 1;

      if (isOptionGroup(option)) {
        return (
          <div key={`group-${option.name}`}>
            <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 text-xs">
              {option.name}
            </DropdownMenuLabel>
            {option.data.map((item: OptionItem, i: number) => (
              <DropdownMenuItem
                key={`${i} ${item.value}`}
                className="h-9 relative cursor-pointer pr-8 whitespace-nowrap dark:focus:bg-sidebar-hover"
                onSelect={() => onSelect(item.value)}
                disabled={item.disabled as boolean}
              >
                {item.name}
                {currentValue === String(item.value) && (
                  <span className="absolute right-2 flex size-3.5 items-center justify-center">
                    <CheckIcon className="size-4" />
                  </span>
                )}
              </DropdownMenuItem>
            ))}
            {!isLast && <DropdownMenuSeparator />}
          </div>
        );
      }

      return (
        <DropdownMenuItem
          key={`${index} ${option.value}`}
          className="h-9 relative cursor-pointer pr-8 whitespace-nowrap dark:focus:bg-sidebar-hover"
          onSelect={() => onSelect(option.value)}
          disabled={option.disabled as boolean}
        >
          {option.name}
          {currentValue === String(option.value) && (
            <span className="absolute right-2 flex size-3.5 items-center justify-center">
              <CheckIcon className="size-4" />
            </span>
          )}
        </DropdownMenuItem>
      );
    });
  };

  if ("control" in props && "name" in props) {
    const { control, name, onChange } = props;

    return (
      <FormField
        control={control}
        name={name}
        render={({ field, fieldState }) => {
          const externalValue = "value" in props ? props.value : undefined;
          const fieldValue = externalValue ?? field.value;
          const displayValue =
            typeof fieldValue === "object" &&
              fieldValue !== null &&
              "code" in fieldValue
              ? String((fieldValue as Record<string, string>).code)
              : (fieldValue ?? undefined);

          const displayText = flattenedOptions.find(
            (opt) => String(opt.value) === String(displayValue),
          )?.name;

          return (
            <FormItem>
              {!hideLabel && (
                <FormLabel className="text-muted-foreground">
                  {label} {isRequired ? isRequiredLabel : ""}
                </FormLabel>
              )}
              <FormControl>
                <DropdownMenu
                  onOpenChange={(open) => {
                    if (!open) setSearch("");
                    else setTimeout(() => searchRef.current?.focus(), 0);
                  }}
                >
                  <DropdownMenuTrigger
                    disabled={disabled}
                    aria-invalid={!!fieldState.error}
                    className={cn(
                      "w-full h-9 border-input flex items-center justify-between gap-2 rounded-md border bg-transparent dark:bg-input/30 dark:hover:bg-input/50 dark:disabled:hover:bg-input/30 px-3 py-2 text-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50",
                      fieldState.error && "border-destructive ring-destructive",
                      className,
                    )}
                  >
                    <span className={cn("truncate min-w-0", !displayText && "text-muted-foreground")}>
                      {displayText ?? placeholder}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {isClearable && displayValue && !disabled && (
                        <X
                          className="size-4 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            field.onChange("");
                            onChange?.("");
                          }}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                          }}
                        />
                      )}
                      <ChevronDownIcon className="size-4 opacity-50 shrink-0" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className={cn("min-w-(--radix-dropdown-menu-trigger-width) w-auto p-0 overflow-hidden", optionsMinWidth)}
                    style={{ minWidth: optionsMinWidth && !optionsMinWidth.startsWith('min-w-') ? optionsMinWidth : undefined }}
                    align="start"
                  >
                    {renderSearchInput()}
                    <div className="max-h-[280px] overflow-y-auto p-1">
                      {renderOptions(
                        displayValue ? String(displayValue) : undefined,
                        (val) => {
                          const original = flattenedOptions.find(
                            (opt) => String(opt.value) === String(val),
                          );
                          const parsedValue = original?.value ?? val;
                          field.onChange(parsedValue);
                          onChange?.(parsedValue);
                        },
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    );
  }

  const { value, onChange, name } = props;
  const displayText = flattenedOptions.find(
    (opt) => String(opt.value) === String(value),
  )?.name;

  return (
    <div className={cn("flex flex-col flex-1 gap-1", hideLabel && "gap-1")}>
      {!hideLabel && (
        <label
          htmlFor={name}
          className="text-sm font-medium text-muted-foreground dark:text-muted-foreground"
        >
          {label} {isRequired ? isRequiredLabel : ""}
        </label>
      )}
      <DropdownMenu
        onOpenChange={(open) => {
          if (!open) setSearch("");
          else setTimeout(() => searchRef.current?.focus(), 0);
        }}
      >
        <DropdownMenuTrigger
          disabled={disabled}
          className={cn(
            "w-full h-9 border-input flex items-center justify-between gap-2 rounded-md border bg-transparent dark:bg-input/30 dark:hover:bg-input/50 dark:disabled:hover:bg-input/30 px-3 py-2 text-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50",
            (props as any).error && "border-destructive ring-destructive",
            className,
          )}
        >
          <span className={cn("truncate min-w-0", !displayText && "text-muted-foreground")}>
            {displayText ?? placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {isClearable && value && !disabled && (
              <X
                className="size-4 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange("");
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
              />
            )}
            <ChevronDownIcon className="size-4 opacity-50 shrink-0" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn("min-w-(--radix-dropdown-menu-trigger-width) w-auto p-0 overflow-hidden", optionsMinWidth)}
          style={{ minWidth: optionsMinWidth && !optionsMinWidth.startsWith('min-w-') ? optionsMinWidth : undefined }}
          align="start"
        >
          {renderSearchInput()}
          <div className="max-h-[280px] overflow-y-auto p-1">
            {renderOptions(value ? String(value) : undefined, onChange)}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
