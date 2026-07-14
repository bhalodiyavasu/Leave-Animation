"use client";

import { useEffect, useState } from "react";
import { Home, ChartLine, CalendarCheck, Settings, HelpCircle, LogOut, Sun, Moon, Palette, User, ReceiptIndianRupee } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import logo from "@/assets/images/logo.png";
import Image from "next/image";
import { ModuleSwitcher } from "./ModuleSwitcher";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { logOut } from "@/store/reducer/auth/authSlice";
import { clearServices } from "@/store/reducer/business/pos/posServiceSlice";
import { useTheme } from "@/lib/next-themes-mock";
import {
  Dropdown,
  DropdownItem,
  DropdownSeparator,
  DropdownSub,
  DropdownSubContent,
  DropdownSubTrigger,
} from "@/components/dropdown/Dropdown";
import { AlertModal } from "@/components/alert-modal/AlertModal";

// Same item style as Sidebar dropdown
const ddItem = "w-full flex items-center gap-3 px-2.5 h-9 rounded-lg text-sm transition-colors text-sidebar-foreground hover:bg-sidebar-hover hover:text-foreground focus:bg-sidebar-hover focus:text-foreground cursor-pointer";
const ddItemActive = "bg-sidebar-active text-foreground hover:bg-sidebar-active hover:text-foreground focus:bg-sidebar-active focus:text-foreground";

const posMenu = [
  { id: "home", label: "Home", icon: Home, path: "/pos" },
  { id: "appointment", label: "Appointment", icon: CalendarCheck, path: "/pos/appointment" },
  { id: "transaction", label: "Transaction", icon: ReceiptIndianRupee, path: "/pos/transaction" },
  { id: "analytics", label: "Analytics", icon: ChartLine, path: "/pos/analytics" },
  { id: "settings", label: "Settings", icon: Settings, path: "/pos/settings" },
];

export const PosSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, allowedMenus, rolesFetchingStatus } = useSelector(
    (state: RootState) => state.auth,
  ) as any;
  const enableDayView = useSelector((state: any) => Boolean(state.posSetting?.settings?.enableDayView));
  const isPosAllowed =
    rolesFetchingStatus === "succeeded" &&
    allowedMenus.includes("business pos");
  const hasNonPosAccess = allowedMenus.some(
    (menu: string) => menu !== "business pos",
  );
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const userInitial = user?.firstName?.[0]?.toUpperCase() ?? null;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  const handleLogout = () => {
    dispatch(logOut());
    dispatch(clearServices());
  };

  return (
    <aside className="w-full lg:w-16 h-16 lg:h-dvh bg-sidebar dark:bg-sidebar border-t lg:border-t-0 lg:border-r border-border flex lg:flex-col flex-row items-center justify-around lg:justify-start lg:pt-4 lg:pb-3 lg:px-0 lg:gap-6 z-50">
      <div className="hidden lg:flex flex-shrink-0">
        <Image src={logo} alt="Krisper" className="w-7 h-auto object-contain" priority />
      </div>

      {posMenu.map((item) => {
        const Icon = item.icon;
        const href = item.id === "appointment" && enableDayView
          ? `/pos/appointment/day?date=${format(new Date(), "yyyy-MM-dd")}`
          : item.path;
        const isActive = item.path === "/pos"
          ? pathname === "/pos"
          : pathname?.startsWith(item.path);

        return (
          <Link
            key={item.id}
            href={href}
            className={cn(
              "group relative p-3 rounded-lg transition-colors flex items-center justify-center flex-shrink-0",
              isActive
                ? "bg-sidebar-active dark:bg-sidebar-active text-primary dark:text-foreground"
                : "text-sidebar-foreground dark:text-sidebar-foreground hover:bg-sidebar-hover dark:hover:bg-sidebar-hover"
            )}
          >
            <Icon size={20} />
            <div className="absolute left-[calc(100%+10px)] px-2.5 py-1.5 bg-foreground text-background text-[12px] font-medium rounded-sm opacity-0 group-hover:opacity-100 translate-x-[-8px] group-hover:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 hidden lg:block">
              {item.label}
            </div>
          </Link>
        );
      })}

      <div className="lg:mt-auto flex lg:flex-col items-center gap-4 flex-shrink-0">
        <Dropdown
          side="top"
          align={isMobile ? "end" : "start"}
          sideOffset={10}
          alignOffset={-5}
          contentClassName="w-56 p-0 overflow-hidden"
          trigger={
            <button
              className={cn(
                "group relative p-[2px] rounded-full transition-all flex items-center justify-center flex-shrink-0",
                "text-sidebar-foreground dark:text-sidebar-foreground",
                "hover:ring-1 hover:ring-border",
                "data-[state=open]:ring-1 data-[state=open]:ring-primary data-[state=open]:ring-offset-1 data-[state=open]:ring-offset-sidebar"
              )}
            >
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                {userInitial ?? <User size={16} />}
              </div>
              <div className="absolute left-[calc(100%+14px)] px-2.5 py-1.5 bg-foreground text-background text-[12px] font-medium rounded-sm opacity-0 group-hover:opacity-100 translate-x-[-8px] group-hover:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 hidden lg:block">
                {fullName || "Profile"}
              </div>
            </button>
          }
        >
          {/* User info header */}
          <div className="flex items-center gap-3 px-2.5 py-2">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold shrink-0">
              {userInitial ?? <User size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{fullName || "Account"}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || user?.username || ""}
              </p>
            </div>
          </div>

          <DropdownSeparator />

          <div className="px-1.5 py-1 flex flex-col gap-0.5">
            <DropdownItem className={ddItem}>
              <HelpCircle size={15} />
              Help
            </DropdownItem>

            <DropdownSub>
              <DropdownSubTrigger className={cn(ddItem, "data-[state=open]:bg-sidebar-hover data-[state=open]:text-foreground")}>
                <Palette size={15} />
                Theme
              </DropdownSubTrigger>
              <DropdownSubContent className="p-1.5 min-w-30 flex flex-col gap-0.5">
                <DropdownItem
                  className={cn(ddItem, mounted && theme === "light" && ddItemActive)}
                  onClick={() => setTheme("light")}
                >
                  <Sun size={15} />
                  Light
                </DropdownItem>
                <DropdownItem
                  className={cn(ddItem, mounted && theme === "dark" && ddItemActive)}
                  onClick={() => setTheme("dark")}
                >
                  <Moon size={15} />
                  Dark
                </DropdownItem>
              </DropdownSubContent>
            </DropdownSub>

            <AlertModal
              title="Log out"
              description={`Are you sure you want to log out from your account ${user?.email || user?.username || ""}?`}
              onSubmit={handleLogout}
              submitText="Log out"
              cancelText="Cancel"
              variant="delete"
            >
              <DropdownItem
                className={cn(ddItem, "text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10 hover:text-destructive")}
                onSelect={(e) => e.preventDefault()}
              >
                <LogOut size={15} className="text-destructive" />
                Log out
              </DropdownItem>
            </AlertModal>
          </div>

          {isPosAllowed && hasNonPosAccess && (
            <>
              <DropdownSeparator />
              <div className="px-2.5 py-1.5 pt-1 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Switch Module</span>
                <ModuleSwitcher />
              </div>
            </>
          )}
        </Dropdown>
      </div>
    </aside>
  );
};
