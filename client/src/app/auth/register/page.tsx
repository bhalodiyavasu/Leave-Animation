"use client";

import { GuestGuard } from "@/src/components/auth/GuestGuard";
import RegisterPage from "@/src/screens/auth/register/registerPage";

export default function RegisterRoute() {
  return (
    <GuestGuard>
      <RegisterPage />
    </GuestGuard>
  );
}
