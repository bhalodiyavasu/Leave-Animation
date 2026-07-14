"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dropdown,
  DropdownItem,
  DropdownSeparator,
  DropdownSub,
  DropdownSubContent,
  DropdownSubTrigger,
} from "@/components/dropdown/Dropdown";
import logo from "@/assets/images/logo.png";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  LogOut,
  Settings,
  HelpCircle,
  SunMoon,
  Sun,
  Moon,
  User,
  Palette,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { logOut } from "@/store/reducer/auth/authSlice";
import { clearServices } from "@/store/reducer/business/pos/posServiceSlice";
import { useTheme } from "@/lib/next-themes-mock";
import {
  menuGroups,
  isMenuGroup,
  type SidebarMenu,
  type MenuGroup,
  type MenuItem,
} from "@/config/menu";
import { ModuleSwitcher } from "./ModuleSwitcher";
import { AlertModal } from "@/components/alert-modal/AlertModal";

// Dropdown item style — visually same colors as sidebar buttons, sized for dropdown
const ddItem = "w-full flex items-center gap-3 px-2.5 h-9 rounded-lg text-sm transition-colors text-sidebar-foreground hover:bg-sidebar-hover hover:text-foreground focus:bg-sidebar-hover focus:text-foreground cursor-pointer";
const ddItemActive = "bg-sidebar-active text-foreground hover:bg-sidebar-active hover:text-foreground focus:bg-sidebar-active focus:text-foreground";

interface SidebarContentProps {
  onItemClick?: () => void;
}

const SidebarContent = ({ onItemClick }: SidebarContentProps) => {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const dispatch = useDispatch();
  const { allowedMenus, rolesFetchingStatus } = useSelector(
    (state: RootState) => state.auth,
  ) as any;
  const isPosAllowed = allowedMenus?.includes("business pos") ?? false;
  const user = useSelector((state: RootState) => state.auth.user) as any;
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200) setProfileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const userInitial = user?.firstName?.[0]?.toUpperCase() ?? null;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  const handleLogout = () => {
    dispatch(logOut());
    dispatch(clearServices());
  };

  const filteredNavGroups = useMemo(() => {
    if (rolesFetchingStatus !== "succeeded") {
      return menuGroups.filter((g) => g.id === "");
    }

    return menuGroups.reduce<SidebarMenu[]>((acc, group) => {
      if (isMenuGroup(group)) {
        const allowedItems = group.items.filter((item) => {
          const name = item.label.toLowerCase();
          const isAllowed = allowedMenus?.includes(name) ?? false;
          return isAllowed && !item.permissionOnly;
        });

        if (allowedItems.length > 0) {
          acc.push({ ...group, items: allowedItems });
        }
      } else {
        const name = group.label.toLowerCase();
        const isAllowed = allowedMenus?.includes(name) ?? false;
        if (isAllowed && !(group as MenuItem).permissionOnly) {
          acc.push(group);
        }
      }
      return acc;
    }, []);
  }, [allowedMenus, rolesFetchingStatus]);

  const getActiveGroup = (path: string) => {
    for (const item of filteredNavGroups) {
      if (isMenuGroup(item)) {
        if (item.items.some((i) => path.startsWith(`/${i.id}`))) {
          return item.id;
        }
      }
    }
    return null;
  };

  const [expandedGroup, setExpandedGroup] = useState<string | null>(() =>
    getActiveGroup(pathname),
  );

  const [prevPath, setPrevPath] = useState(pathname);

  if (pathname !== prevPath) {
    setPrevPath(pathname);
    const activeGroup = getActiveGroup(pathname);
    if (activeGroup !== expandedGroup) {
      setExpandedGroup(activeGroup);
    }
  }

  const navigate = (id: string) => {
    router.push(`/${id}`);
    onItemClick?.();
  };

  return (
    <>
      {/* Header */}
      <div className="h-16 max-sm:h-13 flex items-center pl-4 border-b border-border dark:border-border gap-3">
        <Image src={logo} alt="Krisper ERP" className="w-7 h-auto object-contain" priority />
        <h1 className="text-lg font-semibold text-primary dark:text-primary">
          Krisper ERP
        </h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {filteredNavGroups.map((item) =>
            isMenuGroup(item) ? (
              <SidebarGroup
                key={item.id}
                group={item}
                expandedGroup={expandedGroup}
                currentPath={pathname}
                onToggle={setExpandedGroup}
                onNavigate={navigate}
              />
            ) : (
              <SidebarItem
                key={item.id}
                item={item}
                active={pathname === `/${item.id}`}
                onClick={navigate}
              />
            ),
          )}
        </ul>
      </nav>

      {/* Profile */}
      <div className="border-t border-border dark:border-border">
        <Dropdown
          open={profileOpen}
          onOpenChange={setProfileOpen}
          side="top"
          align="start"
          sideOffset={5}
          alignOffset={5}
          contentStyle={{ width: "calc(var(--radix-dropdown-menu-trigger-width) - 10px)" }}
          contentClassName="p-0 overflow-hidden"
          trigger={
            <button className="w-full flex items-center gap-3 px-3 py-4 hover:bg-sidebar-hover dark:hover:bg-sidebar-hover transition-colors text-left group">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
                {userInitial ?? <User size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate leading-tight">
                  {fullName || "Account"}
                </p>
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  {user?.email || user?.username || ""}
                </p>
              </div>
              <ChevronsUpDown size={15} className="shrink-0 text-muted-foreground group-data-[state=open]:text-foreground" />
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
                <Settings size={15} />
                Settings
              </DropdownItem>
              <DropdownItem className={ddItem}>
                <HelpCircle size={15} />
                Help
              </DropdownItem>

              <DropdownSub>
                <DropdownSubTrigger className={cn(ddItem, "data-[state=open]:bg-sidebar-hover data-[state=open]:text-foreground")}>
                  <Palette size={15} />
                  Theme
                </DropdownSubTrigger>
                <DropdownSubContent className="p-1.5 min-w-30 flex flex-col gap-1 [&>*]:rounded-md">
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
                  className={cn(ddItem, "text-destructive focus:bg-destructive/10 focus:text-destructive")}
                  onSelect={(e) => e.preventDefault()}
                >
                  <LogOut size={15} className="text-destructive" />
                  Log out
                </DropdownItem>
              </AlertModal>
            </div>

            {isPosAllowed && (
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
    </>
  );
};

// ── Sidebar nav items — styles unchanged from original ──────────────────────

const SidebarItem = ({
  item,
  active,
  onClick,
}: {
  item: MenuItem;
  active: boolean;
  onClick: (id: string) => void;
}) => {
  const Icon = item.icon;

  return (
    <li>
      <button
        onClick={() => onClick(item.id)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors",
          active
            ? "bg-sidebar-active dark:bg-sidebar-active text-primary dark:text-foreground"
            : "text-sidebar-foreground dark:text-sidebar-foreground hover:bg-sidebar-hover dark:hover:bg-sidebar-hover",
        )}
      >
        <Icon size={item.iconSize ?? 18} className="shrink-0" />
        <span className="truncate min-w-0">{item.label}</span>
      </button>
    </li>
  );
};

const SidebarGroup = ({
  group,
  expandedGroup,
  currentPath,
  onToggle,
  onNavigate,
}: {
  group: MenuGroup;
  expandedGroup: string | null;
  currentPath: string;
  onToggle: (id: string | null) => void;
  onNavigate: (id: string) => void;
}) => {
  const Icon = group.icon;
  const isExpanded = expandedGroup === group.id;

  return (
    <li>
      <button
        onClick={() => onToggle(isExpanded ? null : group.id)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm text-sidebar-foreground dark:text-sidebar-foreground hover:bg-sidebar-hover dark:hover:bg-sidebar-hover"
      >
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <Icon size={group.iconSize ?? 18} className="shrink-0" />
          <span className="truncate">{group.label}</span>
        </div>
        <div>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {isExpanded && (
        <ul className="mt-1 ml-4 space-y-1 border-l border-border dark:border-border pl-3">
          {group.items.map((item) => {
            const SubIcon = item.icon;
            const active = currentPath.startsWith(`/${item.id}`);

            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors",
                    active
                      ? "bg-sidebar-active dark:bg-sidebar-active text-primary dark:text-foreground"
                      : "text-sidebar-foreground dark:text-sidebar-foreground hover:bg-sidebar-hover dark:hover:bg-sidebar-hover",
                  )}
                >
                  <SubIcon size={item.iconSize ?? 16} className="-mt-[3px] shrink-0" />
                  <span className="truncate min-w-0">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
};

export const Sidebar = ({
  toggleSidebar,
  sidebarCollapsed,
}: {
  toggleSidebar: (value: boolean | null) => void;
  sidebarCollapsed: boolean;
}) => {
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1200) toggleSidebar(false);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [toggleSidebar]);

  return (
    <>
      {/* Desktop */}
      <aside className="flex max-screen-large:hidden w-70 bg-sidebar dark:bg-sidebar border-r border-border dark:border-border flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile */}
      <Sheet open={sidebarCollapsed} onOpenChange={toggleSidebar}>
        <SheetContent
          side="left"
          className="w-70 p-0 hidden max-screen-large:block"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Main navigation</SheetDescription>
          </SheetHeader>

          <div className="flex flex-col h-full bg-sidebar dark:bg-sidebar">
            <SidebarContent onItemClick={() => toggleSidebar(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
