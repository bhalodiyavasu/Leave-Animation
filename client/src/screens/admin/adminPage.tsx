"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/src/store/store";
import { logOut } from "@/src/store/reducer/auth/authSlice";
import {
  useGetAdminLeavesQuery,
  useUpdateLeaveMutation,
  useAskCopilotMutation,
} from "@/src/store/action/leave/leave";
import { toast } from "react-hot-toast";
import { DataTable, DataTableColumn } from "@/components/table/DataTable";
import { StatCard } from "@/components/state-card/StatCard";
import useLeaveSocket from "@/hooks/useLeaveSocket";
import ChatBotCharacter from "@/components/ChatBotCharacter";
import { useCharacterStore } from "@/store/useCharacterStore";

export const AdminPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  useLeaveSocket(user?.id, user?.role?.name); // connects socket for this admin user

  useEffect(() => {
    if (user && user.role?.name !== "Admin") {
      toast.error("Access denied. Admin role required.");
      router.replace("/");
    }
  }, [user, router]);

  const {
    data: leaves = [],
    isLoading: isFetchingLeaves,
    refetch: refetchLeaves,
  } = useGetAdminLeavesQuery(undefined, {
    skip: !user || user.role?.name !== "Admin",
  });
  const [updateLeave, { isLoading: isUpdating }] = useUpdateLeaveMutation();
  const [askCopilot, { isLoading: isAskingCopilot }] = useAskCopilotMutation();

  // State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<"list" | "calendar" | "ai">(
    "list",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [morePopup, setMorePopup] = useState<{
    date: Date;
    leaves: any[];
  } | null>(null);

  // Playful/Professional AI character store states
  const isPlayfulMode = useCharacterStore((state) => state.isPlayfulMode);
  const setIsPlayfulMode = useCharacterStore((state) => state.setIsPlayfulMode);
  const deliveryState = useCharacterStore((state) => state.deliveryState);
  const setDeliveryState = useCharacterStore((state) => state.setDeliveryState);
  const setAnimation = useCharacterStore((state) => state.setAnimation);

  // AI Chat State
  const [aiInput, setAiInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    Array<{
      sender: "user" | "copilot";
      text: string;
      intent?: any;
      data?: any;
      timestamp: Date;
    }>
  >([]);

  // Refs for character delivery sequence
  const pendingMessageRef = React.useRef<string | null>(null);
  const pendingTextToSendRef = React.useRef<string | undefined>(undefined);

  // Typing detection for playful character
  useEffect(() => {
    if (isPlayfulMode) {
      if (aiInput.trim().length > 0) {
        if (deliveryState === "sleeping" || deliveryState === "waiting") {
          setDeliveryState("reading");
        }
      } else {
        if (deliveryState === "reading") {
          setDeliveryState("sleeping");
        }
      }
    }
  }, [aiInput, isPlayfulMode, deliveryState, setDeliveryState]);

  const executeAiMessage = async (queryText: string, textToSend?: string) => {
    // Add user message to state
    const userMsg = {
      sender: "user" as const,
      text: queryText,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setAiInput("");

    if (isPlayfulMode) {
      setAnimation("talk");
    }

    const currentHistory = chatMessages.map((msg) => ({
      sender: msg.sender,
      text: msg.text,
      intent: msg.intent,
    }));

    try {
      const response = await askCopilot({
        message: queryText,
        history: currentHistory,
      }).unwrap();

      const copilotMsg = {
        sender: "copilot" as const,
        text: response.message,
        intent: response.intent,
        data: response.data,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, copilotMsg]);

      if (isPlayfulMode) {
        setAnimation("wave");
        setTimeout(() => {
          setDeliveryState("sleeping");
        }, 3000);
      }

      // If update action successfully processed
      if (response.notifyLeaveUpdate || response.notifyAnalyticsRefresh) {
        refetchLeaves();
      }
    } catch (err: any) {
      console.error("AI Copilot request failed:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "copilot" as const,
          text: "Sorry, I encountered an error trying to process that request. Please try again.",
          timestamp: new Date(),
        },
      ]);
      if (isPlayfulMode) {
        setAnimation("sleep");
        setDeliveryState("sleeping");
      }
    }
  };

  const handleSendAiMessage = async (textToSend?: string) => {
    const queryText = textToSend || aiInput;
    if (!queryText.trim()) return;

    if (isPlayfulMode) {
      // Intercept and do character delivery first
      pendingMessageRef.current = queryText;
      pendingTextToSendRef.current = textToSend;
      setDeliveryState("delivering");
      if (!textToSend) setAiInput("");
      return;
    }

    await executeAiMessage(queryText, textToSend);
  };

  const handlePendingMessageDelivery = () => {
    if (pendingMessageRef.current) {
      executeAiMessage(pendingMessageRef.current, pendingTextToSendRef.current);
      pendingMessageRef.current = null;
      pendingTextToSendRef.current = undefined;
    }
  };

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleLogout = () => {
    dispatch(logOut());
    toast.success("Successfully logged out");
    router.replace("/auth/login");
  };

  const handleStatusChange = async (
    id: string,
    status: "Approved" | "Rejected",
  ) => {
    try {
      await updateLeave({ id, status }).unwrap();
      toast.success(`Leave request ${status.toLowerCase()} successfully!`);
      setIsDetailModalOpen(false);
      setSelectedLeave(null);
    } catch (err: any) {
      console.error("Failed to update status:", err);
      toast.error(
        err?.data?.message || err?.message || `Failed to update status`,
      );
    }
  };

  // Helper calculation
  const stats = useMemo(() => {
    const total = leaves.length;
    const pending = leaves.filter((l) => l.status === "Pending").length;
    const approved = leaves.filter((l) => l.status === "Approved").length;
    const rejected = leaves.filter((l) => l.status === "Rejected").length;
    return { total, pending, approved, rejected };
  }, [leaves]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave: any) => {
      const matchesSearch =
        leave.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.reason?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || leave.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leaves, searchQuery, statusFilter]);

  // Paginated filtered leaves
  const paginatedFilteredLeaves = useMemo(() => {
    return filteredLeaves.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredLeaves, page, pageSize]);

  // Adjust page if it exceeds total pages
  useEffect(() => {
    const totalPages = Math.ceil(filteredLeaves.length / pageSize);
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [filteredLeaves.length, pageSize, page]);

  // Reset page to 1 when filters/search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  // List View Columns (no Actions — handled via rowActions prop)
  const columns: DataTableColumn<any>[] = [
    {
      name: "Employee",
      key: "employee",
      render: (leave) => (
        <div>
          <div className="font-semibold text-white">
            {leave.user?.name || "Unknown"}
          </div>
          <div className="text-[10px] text-sky-200/50">
            {leave.user?.email || "No email"}
          </div>
        </div>
      ),
    },
    {
      name: "Title & Reason",
      key: "title",
      render: (leave) => (
        <div>
          <div className="font-semibold text-foam">{leave.title}</div>
          <div className="text-xs text-sky-200/70 max-w-xs truncate">
            {leave.reason || "—"}
          </div>
        </div>
      ),
    },
    {
      name: "Duration",
      key: "duration",
      render: (leave) => (
        <div className="text-sky-200/80 text-xs">
          <div className="font-semibold">{formatDate(leave.startDate)}</div>
          {leave.endDate && leave.endDate !== leave.startDate && (
            <div className="text-sky-200/40">
              to {formatDate(leave.endDate)}
            </div>
          )}
        </div>
      ),
    },
    {
      name: "Status",
      key: "status",
      render: (leave) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
            leave.status === "Approved"
              ? "bg-foam/10 text-foam border-foam/30 shadow-[0_0_10px_rgba(0,245,212,0.15)]"
              : leave.status === "Rejected"
                ? "bg-red-500/10 text-red-400 border-red-500/30"
                : leave.status === "Pending"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(251,191,36,0.12)]"
                  : "bg-slate-500/10 text-slate-400 border-slate-500/30"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
              leave.status === "Approved"
                ? "bg-foam"
                : leave.status === "Rejected"
                  ? "bg-red-400"
                  : leave.status === "Pending"
                    ? "bg-amber-400"
                    : "bg-slate-400"
            }`}
          ></span>
          {leave.status}
        </span>
      ),
    },
  ];

  // Per-row actions rendered via rowActions prop
  const renderRowActions = (leave: any) => (
    <div className="flex gap-1.5 justify-end">
      <button
        onClick={() => {
          setSelectedLeave(leave);
          setIsDetailModalOpen(true);
        }}
        className="px-2.5 py-1 bg-sky-200/10 hover:bg-sky-200/20 text-white rounded-md text-[10px] font-semibold border border-glass-border/30 transition-all cursor-pointer"
      >
        Details
      </button>
      {leave.status === "Pending" && (
        <>
          <button
            disabled={isUpdating}
            onClick={() => handleStatusChange(leave.id, "Approved")}
            className="px-2.5 py-1 bg-foam/10 hover:bg-foam/25 text-foam border border-foam/30 rounded-md text-[10px] font-semibold transition-all hover:shadow-[0_0_10px_rgba(0,245,212,0.2)] cursor-pointer"
          >
            Approve
          </button>
          <button
            disabled={isUpdating}
            onClick={() => handleStatusChange(leave.id, "Rejected")}
            className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-md text-[10px] font-semibold transition-all cursor-pointer"
          >
            Reject
          </button>
        </>
      )}
    </div>
  );

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday etc.
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = useMemo(() => {
    const days = [];
    // Previous Month Days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = totalDaysInPrevMonth - i;
      days.push({
        day,
        date: new Date(year, month - 1, day),
        isCurrentMonth: false,
      });
    }
    // Current Month Days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      days.push({
        day: i,
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    // Next Month Days to fill the 42 cells (6 rows of 7)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        day: i,
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    return days;
  }, [year, month, startDayOfWeek, totalDaysInMonth, totalDaysInPrevMonth]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Check if leave covers a specific day
  const getLeavesForDate = (date: Date) => {
    const checkTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ).getTime();

    return leaves.filter((leave) => {
      const start = new Date(leave.startDate);
      const startTime = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
      ).getTime();

      const end = leave.endDate ? new Date(leave.endDate) : start;
      const endTime = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate(),
      ).getTime();

      return checkTime >= startTime && checkTime <= endTime;
    });
  };

  const MAX_VISIBLE_ROWS = 3;

  // Pre-compute weeks for the calendar (avoids TS generics inside JSX)
  const calendarWeeks = useMemo(() => {
    return (
      Array.from({ length: 6 }, (_, weekIdx) => {
        const week = calendarDays.slice(weekIdx * 7, weekIdx * 7 + 7);

        // Only collect leaves from current-month days that also STARTED this month
        // Leaves from previous months are excluded so they don't push current events down
        const firstOfMonth = new Date(year, month, 1).getTime();
        const leaveMap: Record<string, any> = {};
        week.forEach((cell) => {
          if (!cell.isCurrentMonth) return;
          getLeavesForDate(cell.date).forEach((leave: any) => {
            const leaveStartTime = new Date(leave.startDate).getTime();
            if (leaveStartTime >= firstOfMonth && !leaveMap[leave.id]) {
              leaveMap[leave.id] = leave;
            }
          });
        });
        const weekLeaves = Object.values(leaveMap);

        // For each leave, compute which columns it occupies in this week
        const allSegments = weekLeaves
          .map((leave: any) => {
            const leaveStart = new Date(leave.startDate);
            const leaveEnd = leave.endDate
              ? new Date(leave.endDate)
              : leaveStart;
            const leaveStartTime = new Date(
              leaveStart.getFullYear(),
              leaveStart.getMonth(),
              leaveStart.getDate(),
            ).getTime();
            const leaveEndTime = new Date(
              leaveEnd.getFullYear(),
              leaveEnd.getMonth(),
              leaveEnd.getDate(),
            ).getTime();

            let colStart = -1;
            let colEnd = -1;
            week.forEach((cell, dayIdx) => {
              if (!cell.isCurrentMonth) return;
              const cellTime = new Date(
                cell.date.getFullYear(),
                cell.date.getMonth(),
                cell.date.getDate(),
              ).getTime();
              if (cellTime >= leaveStartTime && cellTime <= leaveEndTime) {
                if (colStart === -1) colStart = dayIdx + 1;
                colEnd = dayIdx + 2;
              }
            });

            return {
              leave,
              colStart,
              colEnd,
              isMultiDay: colEnd - colStart > 1,
            };
          })
          .filter((seg) => seg.colStart !== -1);

        // Greedy row packing algorithm: assign each segment the lowest available row
        // Sort by start column ascending, then width descending to prioritize longer bars for lower rows
        const sortedSegments = [...allSegments].sort((a, b) => {
          if (a.colStart !== b.colStart) return a.colStart - b.colStart;
          return b.colEnd - b.colStart - (a.colEnd - a.colStart);
        });

        const rows: boolean[][] = []; // rows[rowIndex][colIndex]
        const segmentsWithRows = sortedSegments.map((seg) => {
          let assignedRow = 1;
          while (true) {
            let fits = true;
            const rowIndex = assignedRow - 1;
            if (!rows[rowIndex]) {
              rows[rowIndex] = Array(8).fill(false);
            }
            for (let col = seg.colStart; col < seg.colEnd; col++) {
              if (rows[rowIndex][col]) {
                fits = false;
                break;
              }
            }
            if (fits) {
              break;
            }
            assignedRow++;
          }

          // Mark columns occupied
          const rowIndex = assignedRow - 1;
          for (let col = seg.colStart; col < seg.colEnd; col++) {
            rows[rowIndex][col] = true;
          }

          return { ...seg, row: assignedRow };
        });

        // Only show segments that fit in the first MAX_VISIBLE_ROWS rows
        const visibleSegments = segmentsWithRows.filter(
          (seg) => seg.row <= MAX_VISIBLE_ROWS,
        );

        // Per-day overflow: total leaves starting this month on that day minus how many visible segments cover it
        const dayOverflow: Record<number, number> = {};
        week.forEach((cell, dayIdx) => {
          if (!cell.isCurrentMonth) return;

          const allLeavesForDate = getLeavesForDate(cell.date).filter(
            (leave: any) => {
              const leaveStartTime = new Date(leave.startDate).getTime();
              return leaveStartTime >= firstOfMonth;
            },
          );

          const visibleForDay = visibleSegments.filter(
            (seg) => dayIdx + 1 >= seg.colStart && dayIdx + 1 < seg.colEnd,
          ).length;

          const overflow = allLeavesForDate.length - visibleForDay;
          dayOverflow[dayIdx] = overflow > 0 ? overflow : 0;
        });

        return { week, visibleSegments, dayOverflow };
      })
        // Remove weeks that are entirely other-month days (blank trailing rows)
        .filter(({ week }) => week.some((cell) => cell.isCurrentMonth))
    );
  }, [calendarDays, leaves]);

  if (!user || user.role?.name !== "Admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-foam"></div>
          <p className="text-sky-200/60 text-sm">Authorizing admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-4 md:p-6 bg-transparent text-white overflow-hidden flex flex-col">
      {/* Background bioluminescent orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ocean/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto w-full space-y-6 animate-fade-in flex-1 flex flex-col justify-start">
        {/* Navigation / Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-glass-border/30">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <svg
                className="w-8 h-8 text-foam drop-shadow-[0_0_8px_rgba(0,245,212,0.4)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Coral<span className="text-foam">Admin</span>
            </h1>
            <p className="text-sky-200/50 text-sm mt-1">
              Leave Request Management &amp; Calendars
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-sky-200/10 border border-sky-300/30 hover:bg-sky-200/20 text-white rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer"
            >
              Employee View
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-abyss/60 border border-glass-border hover:border-red-400 hover:text-red-300 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              title: "Total Requests",
              value: stats.total,
              borderColor: "border-glass-border/70",
              hoverBorderColor: "hover:border-cyan/40",
              valueColor: "text-white",
              progressBarColor: "bg-ocean",
            },
            {
              title: "Pending Approval",
              value: stats.pending,
              progressPercent:
                stats.total > 0 ? (stats.pending / stats.total) * 100 : 0,
              borderColor: "border-cyan/25",
              hoverBorderColor: "hover:border-cyan/50",
              valueColor: "text-cyan",
              progressBarColor: "bg-cyan",
            },
            {
              title: "Approved Leaves",
              value: stats.approved,
              progressPercent:
                stats.total > 0 ? (stats.approved / stats.total) * 100 : 0,
              borderColor: "border-foam/25",
              hoverBorderColor: "hover:border-foam/50",
              valueColor: "text-foam",
              progressBarColor: "bg-foam",
            },
            {
              title: "Rejected",
              value: stats.rejected,
              progressPercent:
                stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0,
              borderColor: "border-red-500/20",
              hoverBorderColor: "hover:border-red-500/40",
              valueColor: "text-red-400",
              progressBarColor: "bg-red-500/50",
            },
          ].map((card, index) => (
            <StatCard key={index} {...card} />
          ))}
        </section>

        {/* Tab Selection & Filtering */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-abyss/50 p-4 rounded-2xl border border-glass-border/20 backdrop-blur-md">
          {/* Tabs */}
          <div className="flex bg-deep border border-glass-border/30 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("list")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "list"
                  ? "bg-foam text-deep shadow-[0_0_10px_rgba(0,245,212,0.3)]"
                  : "text-sky-200/70 hover:text-white"
              }`}
            >
              All Requests
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "calendar"
                  ? "bg-foam text-deep shadow-[0_0_10px_rgba(0,245,212,0.3)]"
                  : "text-sky-200/70 hover:text-white"
              }`}
            >
              Calendar View
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "ai"
                  ? "bg-foam text-deep shadow-[0_0_10px_rgba(0,245,212,0.3)]"
                  : "text-sky-200/70 hover:text-white"
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              Coral Copilot
            </button>
          </div>

          {/* Quick Filters */}
          {activeTab !== "ai" && (
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 md:flex-none">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-sky-200/40">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-60 pl-9 pr-4 py-1.5 bg-deep border border-glass-border/30 rounded-xl text-xs text-white placeholder-sky-200/30 focus:outline-none focus:border-foam/50 transition-colors"
                />
              </div>

              {/* Status Select */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-deep border border-glass-border/30 rounded-xl text-xs text-sky-200/80 focus:outline-none focus:border-foam/50 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          )}
        </div>

        {/* Dynamic Content Panel */}
        <div className="flex-1 min-h-[400px]">
          {activeTab === "list" ? (
            <DataTable
              columns={columns}
              data={paginatedFilteredLeaves}
              isLoading={isFetchingLeaves}
              emptyMessage="No matching leave requests found."
              rowActions={renderRowActions}
              rowActionsLabel="Actions"
              page={page}
              pageSize={pageSize}
              total={filteredLeaves.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 30, 50]}
            />
          ) : activeTab === "calendar" ? (
            // Google Calendar-inspired Monthly View (Premium Dark Theme)
            <div className="glass-card rounded-2xl border border-glass-border/30 p-4 md:p-6 shadow-xl backdrop-blur-xl space-y-4">
              {/* Calendar Month Header */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-4 border-b border-glass-border/20">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    {monthNames[month]} {year}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 bg-ocean/20 text-sky-300 rounded border border-ocean/40 font-semibold tracking-wider uppercase">
                    Monthly Grid
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 bg-deep hover:bg-glass-border/20 border border-glass-border/30 rounded-xl transition-all cursor-pointer"
                    aria-label="Previous Month"
                  >
                    <svg
                      className="w-4 h-4 text-sky-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleToday}
                    className="px-3 py-1.5 bg-deep hover:bg-glass-border/20 border border-glass-border/30 rounded-xl text-xs font-semibold text-sky-200 transition-all cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 bg-deep hover:bg-glass-border/20 border border-glass-border/30 rounded-xl transition-all cursor-pointer"
                    aria-label="Next Month"
                  >
                    <svg
                      className="w-4 h-4 text-sky-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-sky-200/50 uppercase tracking-wider py-2">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Calendar Month Grid — week by week with spanning event bars */}
              <div className="rounded-xl overflow-hidden border border-glass-border/20">
                {calendarWeeks.map(
                  ({ week, visibleSegments, dayOverflow }, weekIdx) => (
                    <div
                      key={weekIdx}
                      className="border-b border-glass-border/15 last:border-b-0"
                    >
                      {/* Day number header row */}
                      <div className="grid grid-cols-7 border-b border-glass-border/10">
                        {week.map((cell, dayIdx) => {
                          const isToday =
                            new Date().toDateString() ===
                            cell.date.toDateString();
                          return (
                            <div
                              key={dayIdx}
                              className={`px-2 pt-2 pb-1.5 border-r border-glass-border/10 last:border-r-0 flex justify-between items-start ${
                                cell.isCurrentMonth
                                  ? "bg-deep/50"
                                  : "bg-abyss/40"
                              }`}
                            >
                              {/* Day number — blank for other-month cells */}
                              {cell.isCurrentMonth ? (
                                <span
                                  className={`text-xs font-bold inline-flex items-center justify-center leading-none ${
                                    isToday
                                      ? "w-5 h-5 rounded-full bg-foam text-abyss font-extrabold text-[11px]"
                                      : "text-sky-100/80"
                                  }`}
                                >
                                  {cell.day}
                                </span>
                              ) : (
                                <span />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Events body — fixed equal height for every row including overflow row */}
                      <div
                        className="relative"
                        style={{
                          height: `${(MAX_VISIBLE_ROWS + 1) * 22 + 8}px`,
                        }}
                      >
                        {/* Column background — absolutely positioned, no height effect */}
                        <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                          {week.map((cell, dayIdx) => (
                            <div
                              key={dayIdx}
                              className={`border-r border-glass-border/10 last:border-r-0 ${
                                cell.isCurrentMonth
                                  ? "bg-deep/50"
                                  : "bg-abyss/40"
                              }`}
                            />
                          ))}
                        </div>

                        {/* Leave event bars */}
                        <div
                          className="absolute inset-x-0 top-0 grid grid-cols-7 pt-1"
                          style={{ gridAutoRows: "22px" }}
                        >
                          {visibleSegments.map(
                            ({ leave, colStart, colEnd, row }) => {
                              const colorClass =
                                leave.status === "Approved"
                                  ? "bg-foam/80 text-abyss hover:bg-foam"
                                  : leave.status === "Rejected"
                                    ? "bg-red-500/75 text-white hover:bg-red-500"
                                    : leave.status === "Pending"
                                      ? "bg-amber-500/80 text-abyss hover:bg-amber-500"
                                      : "bg-slate-500/70 text-white hover:bg-slate-500";
                              return (
                                <div
                                  key={leave.id}
                                  onClick={() => {
                                    setSelectedLeave(leave);
                                    setIsDetailModalOpen(true);
                                  }}
                                  title={`${leave.user?.name}: ${leave.title}`}
                                  className={`mx-0.5 px-2 rounded-[5px] text-[9px] md:text-[10px] font-semibold cursor-pointer transition-colors duration-150 truncate leading-[18px] h-[18px] ${colorClass}`}
                                  style={{
                                    gridColumnStart: colStart,
                                    gridColumnEnd: colEnd,
                                    gridRow: row,
                                  }}
                                >
                                  <span className="font-bold mr-1">
                                    {leave.user?.name?.split(" ")[0]}:
                                  </span>
                                  {leave.title}
                                </div>
                              );
                            },
                          )}

                          {/* Render overflow button on row 4 if overflow exists */}
                          {week.map((cell, dayIdx) => {
                            const overflow = dayOverflow[dayIdx] || 0;
                            if (cell.isCurrentMonth && overflow > 0) {
                              return (
                                <button
                                  key={`overflow-${dayIdx}`}
                                  onClick={() =>
                                    setMorePopup({
                                      date: cell.date,
                                      leaves: getLeavesForDate(cell.date),
                                    })
                                  }
                                  className="mx-0.5 px-2 rounded-[5px] text-[9px] md:text-[10px] font-bold text-sky-300 hover:text-foam transition-all cursor-pointer leading-[18px] h-[18px] bg-transparent border border-transparent hover:bg-sky-500/10 hover:border-sky-500/20 text-left truncate"
                                  style={{
                                    gridColumnStart: dayIdx + 1,
                                    gridColumnEnd: dayIdx + 2,
                                    gridRow: MAX_VISIBLE_ROWS + 1,
                                  }}
                                >
                                  +{overflow} more
                                </button>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          ) : (
            // Coral AI Copilot Premium Interface (Full Width)
            <div className="w-full flex flex-col glass-card border border-glass-border/30 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl min-h-[500px] relative">
              {/* 3D Character Overlay */}
              <ChatBotCharacter 
                onDeliverComplete={handlePendingMessageDelivery} 
                aiInput={aiInput}
                isThinking={isAskingCopilot}
              />

              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-glass-border/20 bg-abyss/40 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-foam animate-pulse shadow-[0_0_8px_rgba(0,245,212,0.6)]"></div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-none">
                      Coral Copilot
                    </h3>
                    <p className="text-[10px] text-sky-200/50 mt-1">
                      Active AI HR Assistant
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Playful / Professional Mode Toggle */}
                  <button
                    onClick={() => {
                      const nextMode = !isPlayfulMode;
                      setIsPlayfulMode(nextMode);
                      if (nextMode) {
                        setDeliveryState("sleeping");
                      }
                    }}
                    className={`text-[10px] px-2.5 py-1.5 border rounded-lg transition-all font-bold flex items-center gap-1.5 cursor-pointer ${
                      isPlayfulMode
                        ? "bg-foam/20 hover:bg-foam/30 border-foam/50 text-foam shadow-[0_0_8px_rgba(0,245,212,0.2)]"
                        : "bg-sky-200/10 hover:bg-sky-200/20 border-sky-300/20 text-sky-200/70"
                    }`}
                  >
                    <span>{isPlayfulMode ? "👾 Playful Mode" : "💼 Professional Mode"}</span>
                  </button>

                  <button
                    onClick={() => setChatMessages([])}
                    className="text-[10px] px-2.5 py-1.5 bg-sky-200/10 hover:bg-sky-200/20 border border-sky-300/20 rounded-lg text-sky-200 transition-colors cursor-pointer"
                  >
                    Clear History
                  </button>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[420px] min-h-[350px] bg-deep/20 scrollbar-thin scrollbar-thumb-glass-border">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} animate-fade-in`}
                  >
                    {/* Message Bubble */}
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs md:text-sm shadow-md leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-gradient-to-r from-ocean to-cyan text-white rounded-tr-none"
                          : "bg-abyss/70 border border-glass-border/30 text-sky-100 rounded-tl-none"
                      }`}
                    >
                      {msg.text}

                      {/* Optional Follow-up Question */}
                      {msg.intent?.requiresMoreInfo && msg.intent?.question && (
                        <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-400 font-medium flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">⚠️</span>
                          <span>{msg.intent.question}</span>
                        </div>
                      )}

                      {/* Optional Intent Tag */}
                      {msg.intent && (
                        <div className="mt-2 text-[9px] text-sky-200/60 font-semibold uppercase tracking-wider">
                          confidence: {Math.round(msg.intent.confidence * 100)}%
                        </div>
                      )}
                    </div>

                    {/* Message Data Render (Tables, Lists, KPIs) */}
                    {msg.data && (
                      <div className="w-full mt-3 pl-4 border-l-2 border-foam/30">
                        {/* Leaves list table */}
                        {msg.data.leaves && msg.data.leaves.length > 0 && (
                          <div className="overflow-x-auto rounded-xl border border-glass-border/20 bg-abyss/40 shadow-lg mt-2 max-w-full">
                            <table className="min-w-full divide-y divide-glass-border/10 text-[11px]">
                              <thead className="bg-deep/50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-[9px] font-bold text-sky-200/50 uppercase">
                                    User
                                  </th>
                                  <th className="px-3 py-2 text-left text-[9px] font-bold text-sky-200/50 uppercase">
                                    Title &amp; Reason
                                  </th>
                                  <th className="px-3 py-2 text-left text-[9px] font-bold text-sky-200/50 uppercase">
                                    Start - End
                                  </th>
                                  <th className="px-3 py-2 text-left text-[9px] font-bold text-sky-200/50 uppercase">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-glass-border/10">
                                {msg.data.leaves.map((leave: any) => (
                                  <tr
                                    key={leave.id}
                                    className="hover:bg-deep/20 transition-colors"
                                  >
                                    <td className="px-3 py-2 font-semibold text-white">
                                      {leave.user?.name || "Unknown"}
                                    </td>
                                    <td className="px-3 py-2">
                                      <div className="text-foam">
                                        {leave.title}
                                      </div>
                                      <div className="text-[10px] text-sky-200/50 truncate max-w-xs">
                                        {leave.reason || "—"}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 text-sky-200/70">
                                      {formatDate(leave.startDate)} to{" "}
                                      {formatDate(leave.endDate)}
                                    </td>
                                    <td className="px-3 py-2">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                          leave.status === "Approved"
                                            ? "bg-foam/10 text-foam"
                                            : leave.status === "Rejected"
                                              ? "bg-red-500/10 text-red-400"
                                              : "bg-amber-500/10 text-amber-400"
                                        }`}
                                      >
                                        {leave.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Users list table */}
                        {msg.data.users && msg.data.users.length > 0 && (
                          <div className="overflow-x-auto rounded-xl border border-glass-border/20 bg-abyss/40 shadow-lg mt-2 max-w-full">
                            <table className="min-w-full divide-y divide-glass-border/10 text-[11px]">
                              <thead className="bg-deep/50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-[9px] font-bold text-sky-200/50 uppercase">
                                    Name
                                  </th>
                                  <th className="px-3 py-2 text-left text-[9px] font-bold text-sky-200/50 uppercase">
                                    Email
                                  </th>
                                  <th className="px-3 py-2 text-left text-[9px] font-bold text-sky-200/50 uppercase">
                                    Created At
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-glass-border/10">
                                {msg.data.users.map((u: any) => (
                                  <tr
                                    key={u.id}
                                    className="hover:bg-deep/20 transition-colors"
                                  >
                                    <td className="px-3 py-2 font-semibold text-white">
                                      {u.name}
                                    </td>
                                    <td className="px-3 py-2 text-sky-200/70">
                                      {u.email}
                                    </td>
                                    <td className="px-3 py-2 text-sky-200/50">
                                      {formatDate(u.createdAt)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Action update response counts */}
                        {msg.data.updatedCount !== undefined && msg.data.updatedCount > 0 && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-foam/15 border border-foam/30 rounded-xl text-xs text-foam font-bold mt-2 shadow-[0_0_10px_rgba(0,245,212,0.1)]">
                            <span>✓</span>
                            <span>
                              Successfully updated {msg.data.updatedCount}{" "}
                              record(s).
                            </span>
                          </div>
                        )}

                        {/* Empty array lists */}
                        {msg.data.leaves && msg.data.leaves.length === 0 && (
                          <div className="text-[11px] text-sky-200/40 italic mt-1">
                            No leave records returned.
                          </div>
                        )}
                        {msg.data.users && msg.data.users.length === 0 && (
                          <div className="text-[11px] text-sky-200/40 italic mt-1">
                            No users found.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timestamp */}
                    <span className="text-[9px] text-sky-200/30 mt-1 px-1">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                ))}
              </div>

              {/* Input area */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAiMessage();
                }}
                className="px-6 py-4 border-t border-glass-border/20 bg-abyss/40 flex gap-3 items-center"
              >
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  disabled={isAskingCopilot}
                  placeholder={
                    isAskingCopilot
                      ? "Coral Copilot is analyzing..."
                      : "Ask Coral Copilot... (e.g. 'Show me tomorrow's pending leaves')"
                  }
                  className="flex-1 px-4 py-2.5 bg-deep border border-glass-border/30 rounded-xl text-xs md:text-sm text-white placeholder-sky-200/30 focus:outline-none focus:border-foam/50 transition-colors disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isAskingCopilot || !aiInput.trim()}
                  className="px-4 py-2.5 bg-foam hover:bg-foam/90 disabled:bg-foam/35 text-deep font-extrabold text-xs md:text-sm rounded-xl tracking-wider transition-all shadow-[0_0_15px_rgba(0,245,212,0.25)] flex items-center justify-center cursor-pointer min-w-[70px] disabled:shadow-none"
                >
                  {isAskingCopilot ? (
                    <span className="w-4 h-4 border-2 border-deep border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    "Send"
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Leave Detail Modal */}
      {isDetailModalOpen && selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-abyss/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card rounded-2xl p-6 max-w-lg w-full border border-glass-border shadow-2xl backdrop-blur-xl relative">
            <button
              onClick={() => {
                setIsDetailModalOpen(false);
                setSelectedLeave(null);
              }}
              className="absolute top-4 right-4 text-sky-200/50 hover:text-white transition-colors cursor-pointer"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-foam shadow-[0_0_8px_rgba(0,245,212,0.5)]"></span>
              Leave Request Details
            </h3>
            <p className="text-xs text-sky-200/40 border-b border-glass-border/30 pb-3 mb-4">
              Review employee leave submission credentials and details.
            </p>

            <div className="space-y-4 text-sm text-sky-200/80">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-sky-200/40 uppercase tracking-wider block font-bold">
                    Employee
                  </span>
                  <span className="font-semibold text-white text-base">
                    {selectedLeave.user?.name || "Unknown"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-sky-200/40 uppercase tracking-wider block font-bold">
                    Status
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 mt-0.5 rounded-full text-[10px] font-bold border ${
                      selectedLeave.status === "Approved"
                        ? "bg-foam/10 text-foam border-foam/30"
                        : selectedLeave.status === "Rejected"
                          ? "bg-red-500/10 text-red-400 border-red-500/30"
                          : "bg-cyan/10 text-cyan border-cyan/30"
                    }`}
                  >
                    {selectedLeave.status}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-sky-200/40 uppercase tracking-wider block font-bold">
                  Email Address
                </span>
                <span className="text-white text-xs">
                  {selectedLeave.user?.email || "—"}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-sky-200/40 uppercase tracking-wider block font-bold">
                  Leave Title
                </span>
                <span className="text-foam font-semibold text-base">
                  {selectedLeave.title}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-sky-200/40 uppercase tracking-wider block font-bold">
                  Reason / Notes
                </span>
                <p className="bg-deep/50 border border-glass-border/20 rounded-xl p-3 text-xs text-sky-100/90 italic mt-1 leading-relaxed max-h-36 overflow-y-auto">
                  {selectedLeave.reason ||
                    "No detailed notes provided for this leave request."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-glass-border/30 pt-3">
                <div>
                  <span className="text-[10px] text-sky-200/40 uppercase tracking-wider block font-bold">
                    Start Date
                  </span>
                  <span className="font-semibold text-white">
                    {formatDate(selectedLeave.startDate)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-sky-200/40 uppercase tracking-wider block font-bold">
                    End Date
                  </span>
                  <span className="font-semibold text-white">
                    {formatDate(
                      selectedLeave.endDate || selectedLeave.startDate,
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Approve / Reject buttons inside Modal */}
            <div className="flex gap-3 justify-end border-t border-glass-border/30 pt-4 mt-6">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedLeave(null);
                }}
                className="px-4 py-2 bg-sky-200/10 hover:bg-sky-200/20 text-white rounded-xl text-xs font-semibold transition-all border border-glass-border/20 cursor-pointer"
              >
                Close
              </button>
              {selectedLeave.status === "Pending" && (
                <>
                  <button
                    disabled={isUpdating}
                    onClick={() =>
                      handleStatusChange(selectedLeave.id, "Rejected")
                    }
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Reject Leave
                  </button>
                  <button
                    disabled={isUpdating}
                    onClick={() =>
                      handleStatusChange(selectedLeave.id, "Approved")
                    }
                    className="px-4 py-2 bg-foam/10 hover:bg-foam/25 text-foam border border-foam/30 rounded-xl text-xs font-semibold transition-all hover:shadow-[0_0_15px_rgba(0,245,212,0.3)] cursor-pointer"
                  >
                    Approve Leave
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* "More leaves" popup for a specific day */}
      {morePopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-abyss/80 backdrop-blur-md"
          onClick={() => setMorePopup(null)}
        >
          <div
            className="glass-card rounded-2xl p-5 w-full max-w-sm border border-glass-border shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  {morePopup.date.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                <p className="text-[10px] text-sky-200/40 mt-0.5">
                  {morePopup.leaves.length} leave
                  {morePopup.leaves.length !== 1 ? "s" : ""} on this day
                </p>
              </div>
              <button
                onClick={() => setMorePopup(null)}
                className="text-sky-200/40 hover:text-white transition-colors cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {morePopup.leaves.map((leave: any) => {
                const colorClass =
                  leave.status === "Approved"
                    ? "bg-foam/20 text-foam border-foam/30"
                    : leave.status === "Rejected"
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : leave.status === "Pending"
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "bg-slate-500/20 text-slate-400 border-slate-500/30";
                return (
                  <div
                    key={leave.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border cursor-pointer hover:opacity-80 transition-opacity ${colorClass}`}
                    onClick={() => {
                      setMorePopup(null);
                      setSelectedLeave(leave);
                      setIsDetailModalOpen(true);
                    }}
                  >
                    <div>
                      <p className="text-xs font-bold">
                        {leave.user?.name || "Unknown"}
                      </p>
                      <p className="text-[10px] opacity-80 truncate max-w-[180px]">
                        {leave.title}
                      </p>
                    </div>
                    <span className="text-[9px] font-semibold opacity-70 shrink-0 ml-2">
                      {leave.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
