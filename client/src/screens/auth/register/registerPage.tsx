"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { useRegisterMutation } from "@/src/store/action/auth/auth";
import { registerSchema, RegisterFormValues } from "@/src/validation/auth/registerSchema";
import { Form } from "@/components/ui/form";
import InputField from "@/components/form-inputs/InputField";

const RegisterPage = () => {
  const router = useRouter();
  const [registerUser, { isLoading }] = useRegisterMutation();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit",
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      password: "",
    },
  });

  const { control, handleSubmit } = form;

  const handleRegister = async (data: RegisterFormValues) => {
    try {
      const response = await registerUser(data).unwrap() as any;
      toast.success(response.message || "Registration successful! Please sign in.");
      router.replace("/auth/login");
    } catch (err: any) {
      console.error("Registration failed:", err);
      const errorMessage = err?.data?.message || err?.message || "Registration failed. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-transparent overflow-hidden">
      {/* Dynamic Background Bioluminescent Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ocean/15 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Main Glassmorphism Register Card */}
      <div className="relative z-10 w-full max-w-md glass-card rounded-2xl p-6 border border-glass-border shadow-2xl backdrop-blur-xl animate-fade-in">
        {/* Logo and Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-cyan/10 border border-foam/30 mb-2.5 shadow-[0_0_15px_rgba(0,245,212,0.2)]">
            <svg className="w-7 h-7 text-foam drop-shadow-[0_0_8px_rgba(0,245,212,0.4)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-0.5">
            Coral<span className="text-foam">Leave</span>
          </h2>
          <p className="text-sky-200/60 text-xs">
            Create your account to request and manage leaves
          </p>
        </div>

        {/* Register Form */}
        <Form {...form}>
          <form onSubmit={handleSubmit(handleRegister)} className="space-y-4">
            <InputField
              control={control}
              label="Full Name"
              name="name"
              type="text"
              placeholder="John Doe"
              isRequired
              className="bg-abyss/45 border-glass-border rounded-xl text-white placeholder-sky-200/30 focus:border-foam focus:ring-2 focus:ring-foam/20 transition-all text-sm h-11"
            />

            <InputField
              control={control}
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="e.g. 9876543210"
              isRequired
              className="bg-abyss/45 border-glass-border rounded-xl text-white placeholder-sky-200/30 focus:border-foam focus:ring-2 focus:ring-foam/20 transition-all text-sm h-11"
            />

            <InputField
              control={control}
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@example.com"
              isRequired
              className="bg-abyss/45 border-glass-border rounded-xl text-white placeholder-sky-200/30 focus:border-foam focus:ring-2 focus:ring-foam/20 transition-all text-sm h-11"
            />

            <InputField
              control={control}
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              isRequired
              className="bg-abyss/45 border-glass-border rounded-xl text-white placeholder-sky-200/30 focus:border-foam focus:ring-2 focus:ring-foam/20 transition-all text-sm h-11"
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center glow-btn cursor-pointer disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-abyss" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Account...
                </>
              ) : (
                "Sign Up to CoralLeave"
              )}
            </button>
          </form>
        </Form>

        {/* Footer */}
        <div className="text-center mt-4 pt-4 border-t border-glass-border/40 text-xs text-sky-200/50 space-y-1.5">
          <div>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/auth/login")}
              className="text-foam hover:text-cyan hover:underline transition-colors font-medium cursor-pointer"
            >
              Sign In here
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

export default RegisterPage;
