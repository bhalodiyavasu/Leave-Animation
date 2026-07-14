/**
 * This route is intentionally removed.
 * The full "Forgot → OTP Verify → Reset Password" flow
 * lives at /auth/forgot-password  (ForgotPasswordPage).
 *
 * This file redirects there to avoid a 404 if someone lands on
 * the old /auth/reset-password URL.
 */
import { redirect } from "next/navigation";

export default function ResetPasswordRoute() {
  redirect("/auth/forgot-password");
}
