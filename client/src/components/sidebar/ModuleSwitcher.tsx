"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/assets/images/logo.png";
import { cn } from "@/lib/utils";
import { MonitorSmartphone } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { clearServices } from "@/store/reducer/business/pos/posServiceSlice";

const lastRoutes = { pos: "/pos", admin: "/" };

export const ModuleSwitcher = ({ isCompact = false }: { isCompact?: boolean }) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const { allowedMenus, rolesFetchingStatus } = useSelector(
    (state: RootState) => state.auth,
  ) as any;

  const isPosAllowed = rolesFetchingStatus === "succeeded" && allowedMenus?.includes("business pos");

  const isPosRoute = pathname === "/pos" || pathname?.startsWith("/pos/");
  const [visualPos, setVisualPos] = useState(isPosRoute);

  useEffect(() => {
    setVisualPos(isPosRoute);
  }, [isPosRoute]);

  const handleToggle = (targetIsPos: boolean) => {
    if (targetIsPos === isPosRoute) return;
    if (!targetIsPos && isPosRoute) {
      localStorage.removeItem("pos_checkout_data");
      dispatch(clearServices());
    }
    
    // Start toggle animation
    setVisualPos(targetIsPos);
    
    // Close mobile sidebar normally if it is open
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    
    // Wait for toggle animation and sidebar close (300ms) to complete
    setTimeout(() => {
      const container = document.getElementById("main-layout-container");
      if (container) {
        container.classList.remove("animate-page-slide-in");
        container.classList.add("animate-page-slide-out");
      }
      
      // Wait for page slide out (300ms) to complete before navigating
      setTimeout(() => {
        (window as any).isModuleSwitching = true;
        if (targetIsPos) {
          router.push(lastRoutes.pos || "/pos");
        } else {
          router.push(lastRoutes.admin || "/");
        }
      }, 300);
    }, 300);
  };

  const hasOtherMenus = allowedMenus?.some(
    (m: string) => m !== "business pos",
  ) ?? false;

  if (!isPosAllowed) return null;

  return (
    <div 
      className={cn(
        "relative flex items-center bg-muted/50 p-1 rounded-[15px] border border-border/50 w-fit",
        isCompact ? "flex-row lg:flex-col" : "flex-row"
      )}
    >
      {/* Sliding Background */}
      <div 
        className={cn(
          "absolute bg-background rounded-[12px] transition-transform duration-300 ease-in-out w-9 h-9 left-1 top-1",
          hasOtherMenus && visualPos 
            ? isCompact ? "translate-x-[100%] lg:translate-x-0 lg:translate-y-[100%]" : "translate-x-[100%]" 
            : "translate-x-0 translate-y-0"
        )}
      />  
      
      {/* Admin Toggle */}
      {hasOtherMenus && (
        <button
          onClick={() => handleToggle(false)}
          className={cn(
            "relative z-10 flex items-center justify-center transition-colors w-9 h-9 rounded-lg",
            !visualPos ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
          title="Admin Dashboard"
        >
          <Image 
            src={logo} 
            alt="Admin" 
            className={cn(
              "object-contain transition-all duration-300", 
              "w-[20px] h-[20px]"
            )} 
          />
        </button>
      )}

      {/* POS Toggle */}
      <button
        onClick={() => handleToggle(true)}
        className={cn(
          "relative z-10 flex items-center justify-center transition-colors w-9 h-9 rounded-lg",
          visualPos || !hasOtherMenus ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
        title="POS System"
      >
        <MonitorSmartphone size={18} />
      </button>
    </div>
  );
};
