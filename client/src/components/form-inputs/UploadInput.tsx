"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Control,
  FieldValues,
  Path,
  ControllerRenderProps,
  ControllerFieldState,
} from "react-hook-form";
import { Button } from "../ui/button";
import { useRef, useState, useEffect } from "react";
import { Upload } from "lucide-react";
import Image from "next/image";
import { Loader } from "@/common/loadable-content/Loader";

interface InputFieldProps<T extends FieldValues> {
  control?: Control<T>;
  name?: Path<T>;
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
  className?: string;
  type?: string;
  disabled?: boolean;
  isSelect?: boolean;
  accept?: string;
  bottomText?: string;
  multiple?: boolean;
  onlyButton?: boolean;

  value?: File | File[] | null;
  onChange?: (value: File | File[] | null) => void;
  previewUrl?: string | null;
  onRemovePreview?: () => void;
}

function UploadInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = "Click here to select the files you wish to upload.",
  isRequired = false,
  isSelect = true,
  className = "",
  type = "file",
  accept,
  disabled = false,
  bottomText,
  multiple = false,
  value,
  onChange,
  onlyButton = false,
  previewUrl,
  onRemovePreview,
}: InputFieldProps<T>) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [internalValue, setInternalValue] = useState<File | File[] | null>(
    null,
  );
  const [isImgLoading, setIsImgLoading] = useState(true);
  
  useEffect(() => {
    if (previewUrl) {
      setIsImgLoading(true);
    }
  }, [previewUrl]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    rhfOnChange?: (...event: unknown[]) => void,
  ) => {
    const files = Array.from(e.target.files || []);
    const fileValue = multiple ? files : files[0] || null;

    setInternalValue(fileValue);

    if (rhfOnChange) rhfOnChange(fileValue);
    if (onChange) onChange(fileValue);
  };

  const getDisplayText = (val: unknown): string => {
    if (!val) return placeholder;
    if (typeof val === "string") return placeholder;
    if (Array.isArray(val)) {
      if (val.length === 0) return placeholder;
      return `${val.length} file${val.length > 1 ? "s" : ""} selected`;
    }
    if (typeof val === "object" && val !== null && "name" in val)
      return (val as { name: string }).name || placeholder;
    return placeholder;
  };

  const renderInput = (
    field?: ControllerRenderProps<T, Path<T>>,
    fieldState?: ControllerFieldState,
  ) => {
    let effectiveValue: File | File[] | null | undefined;

    if (field) {
      effectiveValue = field.value;
    } else if (value !== undefined) {
      effectiveValue = value;
    } else {
      effectiveValue = internalValue;
    }

    if (effectiveValue === ("" as any)) effectiveValue = null;

    const displayText = getDisplayText(effectiveValue);

    return (
      <div className="relative">
        <input
          id={field?.name || name}
          ref={(e) => {
            if (field?.ref) field.ref(e);
            fileInputRef.current = e;
          }}
          type={type}
          accept={accept}
          disabled={disabled}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFileChange(e, field?.onChange)}
        />

        {onlyButton ? (
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Upload size={16} />
            {multiple ? "Select Files" : "Select File"}
          </Button>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`h-[68px] border-2 border-dashed rounded-lg p-2 flex items-center justify-between text-sm cursor-pointer focus-visible:border-ring focus-visible:ring-ring/80 hover:bg-muted/60 focus-visible:ring-2 w-auto gap-3 ${className} ${
              fieldState?.error
                ? "border-destructive ring-destructive/20"
                : "border-input"
            } ${
              disabled
                ? "pointer-events-none cursor-not-allowed opacity-50 md:text-sm"
                : "bg-upload-bg"
            } ${
              displayText === placeholder
                ? "text-muted-foreground"
                : "text-foreground"
            } ${previewUrl ? "shadow-none" : ""}`}
          >
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              {previewUrl && (
                <div className="relative shrink-0 w-12 h-12 rounded-md overflow-hidden border bg-background z-10 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                  {isImgLoading && (
                    <div className="absolute inset-0 bg-muted/40 z-10 flex items-center justify-center">
                      <Loader width={16} height={16} className="text-gray-400" />
                    </div>
                  )}
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className={`object-cover transition-opacity duration-300 ${isImgLoading ? "opacity-0" : "opacity-100"}`}
                    unoptimized
                    onLoad={() => setIsImgLoading(false)}
                    onError={() => setIsImgLoading(false)}
                  />
                </div>
              )}
              <span title={displayText} className="truncate block max-w-full">
                {displayText}
              </span>
            </div>
            {isSelect && (
              previewUrl && !disabled && onRemovePreview ? (
                <Button
                  type="button"
                  variant="destructiveFilled"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePreview();
                  }}
                >
                  Remove
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={disabled}
                >
                  {multiple ? "Select Files" : "Select File"}
                </Button>
              )
            )}
          </div>
        )}
      </div>
    );
  };

  if (control && name) {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <FormItem>
            {label && (
              <div className="flex flex-row gap-3">
                <FormLabel
                  htmlFor={field.name}
                  className="text-muted-foreground"
                >
                  {label}{" "}
                  {isRequired && <span className="text-red-500">*</span>}
                </FormLabel>
              </div>
            )}
            <FormControl>{renderInput(field, fieldState)}</FormControl>
            {bottomText && (
              <span className="italic text-sm text-muted-foreground">
                {bottomText}
              </span>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex flex-row gap-3">
          <label htmlFor={name} className="text-sm font-medium">
            {label} {isRequired && <span className="text-red-500">*</span>}
          </label>
        </div>
      )}
      {renderInput()}
      {bottomText && (
        <span className="italic text-sm text-muted-foreground">
          {bottomText}
        </span>
      )}
    </div>
  );
}

export default UploadInput;
