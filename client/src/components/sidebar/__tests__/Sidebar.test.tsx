import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Sidebar } from "../Sidebar";

// Mock dependencies
const mockPush = vi.fn();
let currentPath: string | null = "/dashboard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => currentPath,
}));

const { mockState } = vi.hoisted(() => ({
  mockState: {
    allowedMenus: ["dashboard", "clients", "sales dashboard", "sales analytics", "quotations", "sales orders"],
    rolesFetchingStatus: "succeeded",
  }
}));

vi.mock("react-redux", () => ({
  useDispatch: () => vi.fn(),
  useSelector: (selector: any) =>
    selector({
      auth: {
        user: { firstName: "John", lastName: "Doe" },
        allowedMenus: mockState.allowedMenus,
        rolesFetchingStatus: mockState.rolesFetchingStatus,
      },
    }),
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children, open }: any) => (
    <div data-testid="sheet" data-open={open}>
      {children}
    </div>
  ),
  SheetContent: ({ children, className }: any) => (
    <div data-testid="sheet-content" className={className}>
      {children}
    </div>
  ),
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
  SheetDescription: ({ children }: any) => <div>{children}</div>,
}));

describe("Sidebar", () => {
  const mockToggleSidebar = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockState.allowedMenus = ["dashboard", "clients", "sales dashboard", "sales analytics", "quotations", "sales orders"];
    mockState.rolesFetchingStatus = "succeeded";
    currentPath = "/dashboard";
    
    // Mock innerWidth
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
  });

  const getDesktopText = (text: string | RegExp) => {
    const elements = screen.getAllByText(text);
    return elements[0];
  };

  const queryDesktopText = (text: string | RegExp) => {
    const elements = screen.queryAllByText(text);
    return elements.length > 0 ? elements[0] : null;
  };

  it("renders correctly with allowed menus", () => {
    render(<Sidebar toggleSidebar={mockToggleSidebar} sidebarCollapsed={false} />);
    
    expect(getDesktopText("Krisper ERP")).toBeInTheDocument();
    expect(getDesktopText("Dashboard")).toBeInTheDocument();
    expect(getDesktopText("Clients")).toBeInTheDocument();
    expect(getDesktopText("Sales")).toBeInTheDocument();
  });

  it("filters out unauthorized menus", () => {
    mockState.allowedMenus = ["dashboard"]; // Only dashboard is allowed
    render(<Sidebar toggleSidebar={mockToggleSidebar} sidebarCollapsed={false} />);
    
    expect(queryDesktopText("Clients")).not.toBeInTheDocument();
    expect(queryDesktopText("Sales")).not.toBeInTheDocument();
    expect(getDesktopText("Dashboard")).toBeInTheDocument();
  });

  it("handles loading/failed rolesFetchingStatus", () => {
    mockState.rolesFetchingStatus = "loading";
    render(<Sidebar toggleSidebar={mockToggleSidebar} sidebarCollapsed={false} />);
    
    expect(queryDesktopText("Clients")).not.toBeInTheDocument();
    expect(getDesktopText("Dashboard")).toBeInTheDocument();
  });

  it("toggles groups on click", async () => {
    render(<Sidebar toggleSidebar={mockToggleSidebar} sidebarCollapsed={false} />);

    const salesGroup = getDesktopText("Sales").closest("button");
    expect(screen.queryAllByText("Sales Dashboard").length).toBe(0);
    
    fireEvent.click(salesGroup!);
    expect(screen.getAllByText("Sales Dashboard")[0]).toBeInTheDocument();

    fireEvent.click(salesGroup!);
    expect(screen.queryAllByText("Sales Dashboard").length).toBe(0);
  });

  it("handles navigation on item click", () => {
    render(<Sidebar toggleSidebar={mockToggleSidebar} sidebarCollapsed={false} />);

    const clientsItem = getDesktopText("Clients").closest("button");
    fireEvent.click(clientsItem!);

    expect(mockPush).toHaveBeenCalledWith("/client");
  });

  it("handles sub-item navigation and calls onItemClick on mobile", () => {
    render(<Sidebar toggleSidebar={mockToggleSidebar} sidebarCollapsed={true} />);

    const mobileContent = screen.getByTestId("sheet-content");
    const salesGroup = (within: HTMLElement) => {
        const btns = within.querySelectorAll('button');
        for (const btn of Array.from(btns)) {
            if (btn.textContent?.includes("Sales")) return btn;
        }
        return null;
    };

    const groupBtn = salesGroup(mobileContent);
    fireEvent.click(groupBtn!);

    const subItemBtn = (within: HTMLElement, text: string) => {
        const btns = within.querySelectorAll('button');
        for (const btn of Array.from(btns)) {
            if (btn.textContent === text) return btn;
        }
        return null;
    };

    const salesDashboard = subItemBtn(mobileContent, "Sales Dashboard");
    fireEvent.click(salesDashboard!);

    expect(mockPush).toHaveBeenCalledWith("/sales/sales-dashboard");
    expect(mockToggleSidebar).toHaveBeenCalledWith(false);
  });

  it("expands active group based on pathname on mount", () => {
    currentPath = "/sales/sales-dashboard";
    render(<Sidebar toggleSidebar={mockToggleSidebar} sidebarCollapsed={false} />);

    expect(getDesktopText("Sales Dashboard")).toBeInTheDocument();
  });

  it("updates expanded group when pathname changes", () => {
    const { rerender } = render(<Sidebar toggleSidebar={mockToggleSidebar} sidebarCollapsed={false} />);
    
    expect(screen.queryAllByText("Sales Dashboard").length).toBe(0);

    // Change path
    currentPath = "/sales/sales-dashboard";
    rerender(<Sidebar toggleSidebar={mockToggleSidebar} sidebarCollapsed={false} />);

    expect(getDesktopText("Sales Dashboard")).toBeInTheDocument();
  });

  it("handles resize to desktop width", () => {
    window.innerWidth = 500;
    render(<Sidebar toggleSidebar={mockToggleSidebar} sidebarCollapsed={false} />);
    
    expect(mockToggleSidebar).not.toHaveBeenCalled();

    window.innerWidth = 1300;
    act(() => {
        window.dispatchEvent(new Event('resize'));
    });

    expect(mockToggleSidebar).toHaveBeenCalledWith(false);
  });



  it("handles null pathname gracefully", () => {
    currentPath = null;
    render(<Sidebar toggleSidebar={mockToggleSidebar} sidebarCollapsed={false} />);
    expect(getDesktopText("Dashboard")).toBeInTheDocument();
  });

  it("does not update expandedGroup if activeGroup remains the same during path change", () => {
    currentPath = "/sales/quotations";
    mockState.allowedMenus = ["dashboard", "sales dashboard", "quotations", "sales orders"];
    const { rerender } = render(<Sidebar toggleSidebar={mockToggleSidebar} sidebarCollapsed={false} />);
    
    expect(getDesktopText("Quotations")).toBeInTheDocument();

    currentPath = "/sales/sales-order";
    rerender(<Sidebar toggleSidebar={mockToggleSidebar} sidebarCollapsed={false} />);

    expect(getDesktopText("Sales Orders")).toBeInTheDocument();
  });

  it("applies active styling to SidebarItem", () => {
    currentPath = "/client";
    render(<Sidebar toggleSidebar={mockToggleSidebar} sidebarCollapsed={false} />);
    
    const clientsBtn = getDesktopText("Clients").closest("button");
    expect(clientsBtn).toHaveClass("bg-sidebar-active");
    
    const dashboardBtn = getDesktopText("Dashboard").closest("button");
    expect(dashboardBtn).not.toHaveClass("bg-sidebar-active");
  });
});
