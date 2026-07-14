"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store/store";

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const token = localStorage.getItem("token");
    if (isAuthenticated || token) {
      router.replace("/");
    }
  }, [isAuthenticated, isMounted, router]);

  // Prevent SSR/hydration mismatches by rendering nothing on server side
  if (!isMounted) {
    return null;
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (isAuthenticated || token) {
    return null;
  }

  return <>{children}</>;
}
