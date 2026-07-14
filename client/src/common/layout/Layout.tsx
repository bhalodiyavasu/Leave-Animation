"use client";

import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/src/components/auth/AuthGuard";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth/");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (isClient === false) {
    return (
      <div className="min-h-dvh bg-background-secondary">
        <Toaster position="top-right" />
      </div>
    );
  }

  if (isAuthPage) {
    return (
      <div key="auth-layout" className="min-h-dvh flex flex-col">
        {children}
        <Toaster position="top-right" />
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="overflow-x-hidden w-full">
      <AuthGuard>
        <div 
          key="admin"
          id="main-layout-container"
          className="min-h-dvh bg-background-secondary"
        >
          {children}
          <Toaster position="top-right" />
        </div>
      </AuthGuard>
    </div>
  );
};

export default MainLayout;