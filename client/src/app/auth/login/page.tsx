"use client";

import { GuestGuard } from "@/src/components/auth/GuestGuard";
import LoginPage from "@/src/screens/auth/login/loginPage";


export default function LoginRoute() {
  return (
    <GuestGuard>
        <LoginPage />
    </GuestGuard>
  );
}
