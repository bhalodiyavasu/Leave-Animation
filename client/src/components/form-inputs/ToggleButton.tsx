"use client";

import { Control, FieldValues, Path } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

type BaseProps = {
  disabled?: boolean;
  className?: string;
};

type WithForm<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  onChange?: (checked: boolean) => void;
};

type WithoutForm = {
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

type ToggleButtonProps<T extends FieldValues> = BaseProps &
  (WithForm<T> | WithoutForm);

export default function ToggleButton<T extends FieldValues>(
  props: ToggleButtonProps<T>,
) {
  const { disabled, className } = props;

  if ("control" in props && "name" in props) {
    const { control, name, onChange } = props;

    return (
      <FormField
        control={control}
        name={name}
        render={({ field }) => {
          const checked = Boolean(field.value);

          return (
            <FormItem>
              <FormLabel htmlFor={field.name} className="sr-only">
                Toggle
              </FormLabel>
              <FormControl>
                <Switch
                  id={field.name}
                  checked={checked}
                  disabled={disabled}
                  className={className}
                  onCheckedChange={(value) => {
                    field.onChange(value);
                    onChange?.(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    );
  }

  const { checked, onChange, name } = props;

  return (
    <div>
      <Switch
        id={name}
        checked={checked}
        disabled={disabled}
        className={className}
        onCheckedChange={onChange}
      />
    </div>
  );
}
