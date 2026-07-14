"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { useLoginMutation } from "@/src/store/action/auth/auth";
import { loginSchema, LoginFormValues } from "@/src/validation/auth/loginSchema";
import { Form } from "@/components/ui/form";
import InputField from "@/components/form-inputs/InputField";

const LoginPage = () => {
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(false);



  const [login, { isLoading }] = useLoginMutation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { control, handleSubmit } = form;

  const handleLogin = async (data: LoginFormValues) => {
    try {
      const response = await login(data).unwrap() as any;
      toast.success(response.message || "Welcome back! Login successful.");
      router.replace("/");
    } catch (err: any) {
      console.error("Login failed:", err);
      const errorMessage = err?.data?.message || err?.message || "Invalid credentials. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-transparent overflow-hidden">

      {/* Dynamic Background Bioluminescent Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ocean/15 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Main Glassmorphism Login Card */}
      <div className="relative z-10 w-full max-w-md glass-card rounded-2xl p-6 border border-glass-border shadow-2xl backdrop-blur-xl animate-fade-in">
        
        {/* Logo and Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-cyan/10 border border-foam/30 mb-2.5 shadow-[0_0_15px_rgba(0,245,212,0.2)]">
            <svg className="w-7 h-7 text-foam drop-shadow-[0_0_8px_rgba(0,245,212,0.4)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-0.5">
            Coral<span className="text-foam">Leave</span>
          </h2>
          <p className="text-sky-200/60 text-xs">
            Portal to the Leave Management System
          </p>
        </div>

        {/* Login Form */}
        <Form {...form}>
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
            
            <InputField
              control={control}
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@example.com"
              isRequired
              className="bg-abyss/45 border-glass-border rounded-xl text-white placeholder-sky-200/30 focus:border-foam focus:ring-2 focus:ring-foam/20 transition-all text-sm h-11"
            />

            <div className="relative">
              <div className="flex justify-between items-center absolute right-0 top-[-26px] z-20">
                <button
                  type="button"
                  onClick={() => router.push("/auth/forgot-password")}
                  className="text-xs text-foam hover:text-cyan hover:underline transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <InputField
                control={control}
                label="Password"
                name="password"
                type="password"
                placeholder="••••••••"
                isRequired
                className="bg-abyss/45 border-glass-border rounded-xl text-white placeholder-sky-200/30 focus:border-foam focus:ring-2 focus:ring-foam/20 transition-all text-sm h-11"
              />
            </div>

            {/* Remember Me checkbox */}
            <div className="flex items-center justify-between pb-1 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-glass-border bg-abyss/45 text-foam focus:ring-foam/30 transition-all cursor-pointer"
                />
                <span className="text-xs text-sky-200/70 hover:text-sky-200 transition-colors">
                  Keep my session alive
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center glow-btn cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-abyss" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Diving in...
                </>
              ) : (
                "Sign In to CoralLeave"
              )}
            </button>
          </form>
        </Form>

        {/* Footer */}
        <div className="text-center mt-4 pt-4 border-t border-glass-border/40 text-xs text-sky-200/50 space-y-1.5">
          <div>
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/auth/register")}
              className="text-foam hover:text-cyan hover:underline transition-colors font-medium cursor-pointer"
            >
              Sign Up here
            </button>
          </div>
          <div>
            Need support?{" "}
            <a href="mailto:admin@coralleave.com" className="text-foam hover:text-cyan hover:underline transition-colors font-medium">
              Contact System Administrator
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;