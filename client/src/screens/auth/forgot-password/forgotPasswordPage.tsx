"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
} from "@/src/store/action/auth/auth";
import InputField from "@/components/form-inputs/InputField";

const ForgotPasswordPage = () => {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP, 3: Reset Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Mutation hooks
  const [sendOtp, { isLoading: isSendingOtp }] = useForgotPasswordMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyOtpMutation();
  const [resetPassword, { isLoading: isResettingPassword }] =
    useResetPasswordMutation();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    try {
      const response = (await sendOtp({ email }).unwrap()) as any;
      toast.success(
        response.message || "Verification code sent to your email!",
      );
      setStep(2);
    } catch (err: any) {
      console.error("Failed to send OTP:", err);
      toast.error(
        err?.data?.message ||
          err?.message ||
          "Failed to send code. Please try again.",
      );
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast.error("Please enter the verification code");
      return;
    }
    try {
      const response = (await verifyOtp({ email, otp }).unwrap()) as any;
      toast.success(response.message || "Code verified successfully!");
      setStep(3);
    } catch (err: any) {
      console.error("Failed to verify OTP:", err);
      toast.error(
        err?.data?.message ||
          err?.message ||
          "Invalid or expired code. Please try again.",
      );
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      const response = (await resetPassword({
        email,
        newPassword,
        confirmPassword,
      }).unwrap()) as any;
      toast.success(response.message || "Password updated successfully!");
      router.replace("/auth/login");
    } catch (err: any) {
      console.error("Failed to change password:", err);
      toast.error(
        err?.data?.message ||
          err?.message ||
          "Failed to update password. Please try again.",
      );
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-transparent overflow-hidden">
      {/* Bioluminescent Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ocean/15 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Glassmorphic card */}
      <div className="relative z-10 w-full max-w-md glass-card rounded-2xl p-6 border border-glass-border shadow-2xl backdrop-blur-xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-cyan/10 border border-foam/30 mb-2 shadow-[0_0_15px_rgba(0,245,212,0.2)]">
            <svg
              className="w-7 h-7 text-foam drop-shadow-[0_0_8px_rgba(0,245,212,0.4)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-0.5">
            {step === 1 && "Forgot Password"}
            {step === 2 && "Verify Code"}
            {step === 3 && "Reset Password"}
          </h2>
          <p className="text-sky-200/60 text-xs">
            {step === 1 && "Send a verification code to your email"}
            {step === 2 && `Enter the OTP sent to ${email}`}
            {step === 3 && "Create a secure new password"}
          </p>
        </div>

        {/* STEP 1: Send OTP Form */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <InputField
              label="Registered Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              isRequired
              className="bg-abyss/45 border-glass-border rounded-xl text-white placeholder-sky-200/30 focus:border-foam focus:ring-2 focus:ring-foam/20 transition-all text-sm h-11"
            />
            <button
              type="submit"
              disabled={isSendingOtp}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center glow-btn cursor-pointer disabled:opacity-50"
            >
              {isSendingOtp ? "Sending Code..." : "Send Verification Code"}
            </button>
          </form>
        )}

        {/* STEP 2: Verify OTP Form */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <InputField
              label="Verification Code (OTP)"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit code"
              isRequired
              maxLength={6}
              className="bg-abyss/45 border-glass-border rounded-xl text-white placeholder-sky-200/30 focus:border-foam focus:ring-2 focus:ring-foam/20 transition-all text-sm tracking-widest text-center font-bold h-11"
            />
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 rounded-xl border border-glass-border text-sky-200/70 hover:text-white transition-all text-xs font-semibold cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isVerifyingOtp}
                className="flex-[2] py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center glow-btn cursor-pointer disabled:opacity-50"
              >
                {isVerifyingOtp ? "Verifying..." : "Verify Code"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Reset Password Form */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <InputField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              isRequired
              className="bg-abyss/45 border-glass-border rounded-xl text-white placeholder-sky-200/30 focus:border-foam focus:ring-2 focus:ring-foam/20 transition-all text-sm h-11"
            />

            <InputField
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              isRequired
              className="bg-abyss/45 border-glass-border rounded-xl text-white placeholder-sky-200/30 focus:border-foam focus:ring-2 focus:ring-foam/20 transition-all text-sm h-11"
            />

            <button
              type="submit"
              disabled={isResettingPassword}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center glow-btn cursor-pointer mt-3 disabled:opacity-50"
            >
              {isResettingPassword
                ? "Updating Password..."
                : "Save New Password"}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="text-center mt-4 pt-4 border-t border-glass-border/40 text-xs text-sky-200/50">
          Remember your password?{" "}
          <button
            onClick={() => router.push("/auth/login")}
            className="text-foam hover:text-cyan hover:underline transition-colors font-medium cursor-pointer"
          >
            Sign In here
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
export { ForgotPasswordPage };
