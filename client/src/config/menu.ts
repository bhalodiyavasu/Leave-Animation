import { Home, Calendar, Users, BarChart } from "lucide-react";

export interface MenuItem {
  id: string;
  label: string;
  icon: any;
  iconSize?: number;
  permissionOnly?: boolean;
}

export interface MenuGroup {
  id: string;
  label: string;
  icon: any;
  iconSize?: number;
  items: MenuItem[];
}

export type SidebarMenu = MenuItem | MenuGroup;

export const isMenuGroup = (item: SidebarMenu): item is MenuGroup => {
  return "items" in item;
};

export const menuGroups: SidebarMenu[] = [
  {
    id: "home",
    label: "Dashboard",
    icon: Home,
    iconSize: 18,
  },
  {
    id: "admin",
    label: "Admin Portal",
    icon: Users,
    iconSize: 18,
  },
];
