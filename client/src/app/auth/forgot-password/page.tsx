"use client";

import { GuestGuard } from "@/src/components/auth/GuestGuard";
import ForgotPasswordPage from "@/src/screens/auth/forgot-password/forgotPasswordPage";

export default function ForgotPasswordRoute() {
  return (
    <GuestGuard>
      <ForgotPasswordPage />
    </GuestGuard>
  );
}
