import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import React from "react";

interface AlertModalProps {
  children?: React.ReactNode;
  title?: string;
  description?: React.ReactNode;
  media?: React.ReactNode;
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  variant?: "default" | "delete";
  isCustomization?: boolean;
  trigger?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
  isSubmitDisabled?: boolean;
  open?: boolean;
  className?: string;
}

export function AlertModal({
  children,
  title,
  description,
  media,
  onSubmit,
  submitText = "Submit",
  cancelText = "Cancel",
  variant = "default",
  isCustomization = false,
  trigger,
  onOpenChange,
  isSubmitDisabled = false,
  open,
  className,
}: AlertModalProps) {
  const submitVariant = variant === "delete" ? "destructiveFilled" : "default";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {open === undefined && (
        <AlertDialogTrigger asChild>
          {trigger || children}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent className={className}>
        {isCustomization ? (
          children
        ) : (
          <>
            <AlertDialogHeader>
              {media && <AlertDialogMedia>{media}</AlertDialogMedia>}
              <AlertDialogTitle>{title}</AlertDialogTitle>
              {description && (
                <AlertDialogDescription asChild>
                  {typeof description === "string" ? (
                    <p>{description}</p>
                  ) : (
                    <div>{description}</div>
                  )}
                </AlertDialogDescription>
              )}
            </AlertDialogHeader>
            {trigger && children}
            <AlertDialogFooter>
              <AlertDialogCancel>{cancelText}</AlertDialogCancel>
              <AlertDialogAction variant={submitVariant} onClick={onSubmit} disabled={isSubmitDisabled}>
                {submitText}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
