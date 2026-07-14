"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/src/store/store";
import { logOut } from "@/src/store/reducer/auth/authSlice";
import {
  useGetLeavesQuery,
  useCreateLeaveMutation,
  useDeleteLeaveMutation,
} from "@/src/store/action/leave/leave";
import { toast } from "react-hot-toast";
import InputField from "@/components/form-inputs/InputField";
import { DataTable, DataTableColumn } from "@/components/table/DataTable";
import { StatCard } from "@/components/state-card/StatCard";
import useLeaveSocket from "@/hooks/useLeaveSocket";

export const HomePage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  // Leave API Hooks
  const { data: leaves = [], isLoading: isFetchingLeaves } =
    useGetLeavesQuery();
  const [createLeave, { isLoading: isCreating }] = useCreateLeaveMutation();
  const [deleteLeave] = useDeleteLeaveMutation();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Paginated Data
  const paginatedLeaves = React.useMemo(() => {
    return leaves.slice((page - 1) * pageSize, page * pageSize);
  }, [leaves, page, pageSize]);

  // Adjust page if it exceeds total pages
  useEffect(() => {
    const totalPages = Math.ceil(leaves.length / pageSize);
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [leaves.length, pageSize, page]);

  useLeaveSocket(user?.id, user?.role?.name);

  const handleLogout = () => {
    dispatch(logOut());
    toast.success("Successfully logged out from CoralLeave");
    router.replace("/auth/login");
  };

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title) {
      toast.error("Please enter a title for your leave");
      return;
    }
    if (!startDate) {
      toast.error("Please select a start date");
      return;
    }

    if (endDate && new Date(endDate) < new Date(startDate)) {
      toast.error("End date cannot be earlier than start date");
      return;
    }

    try {
      await createLeave({
        title,
        reason: reason || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      }).unwrap();

      toast.success("Leave request submitted successfully!");
      setIsModalOpen(false);
      // Reset form
      setTitle("");
      setReason("");
      setStartDate("");
      setEndDate("");
    } catch (err: any) {
      console.error("Failed to create leave:", err);
      toast.error(
        err?.data?.message || err?.message || "Failed to submit leave request",
      );
    }
  };

  const handleDeleteLeave = async (id: string) => {
    if (
      !window.confirm("Are you sure you want to withdraw this leave request?")
    ) {
      return;
    }

    try {
      await deleteLeave(id).unwrap();
      toast.success("Leave request withdrawn successfully.");
    } catch (err: any) {
      console.error("Failed to delete leave:", err);
      toast.error(
        err?.data?.message ||
          err?.message ||
          "Failed to withdraw leave request",
      );
    }
  };

  // Helper Calculations
  const totalAllowed = 24;
  const approvedLeaves = leaves.filter((l) => l.status === "Approved");

  // Calculate total days taken
  const daysTaken = approvedLeaves.reduce((acc, leave) => {
    const start = new Date(leave.startDate);
    const end = leave.endDate ? new Date(leave.endDate) : start;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return acc + diffDays;
  }, 0);

  const pendingCount = leaves.filter((l) => l.status === "Pending").length;
  const remainingLeaves = Math.max(0, totalAllowed - daysTaken);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const columns: DataTableColumn<any>[] = [
    {
      name: "Title",
      key: "title",
      render: (leave) => (
        <span className="font-semibold text-white">{leave.title}</span>
      ),
    },
    {
      name: "Reason",
      key: "reason",
      render: (leave) => (
        <span className="text-sky-200/70 max-w-xs truncate block">
          {leave.reason || "—"}
        </span>
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
      className: "text-center",
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

  return (
    <div className="relative min-h-screen p-4 md:p-6 bg-transparent text-white overflow-hidden flex flex-col">
      {/* Main Container */}
      <div className="relative z-10 max-w-6xl mx-auto w-full space-y-6 animate-fade-in flex-1 flex flex-col justify-start">
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
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
              Coral<span className="text-foam">Dashboard</span>
            </h1>
            <p className="text-sky-200/50 text-sm mt-1">
              Welcome back,{" "}
              <span className="text-foam font-semibold">
                {user?.name || "User"}
              </span>{" "}
              ({user?.role?.name || "Employee"})
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user?.role?.name === "Admin" && (
              <button
                onClick={() => router.push("/admin")}
                className="px-4 py-2 bg-foam/10 border border-foam/30 hover:bg-foam/20 text-foam rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,245,212,0.15)] cursor-pointer"
              >
                Admin Panel
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-abyss/60 border border-glass-border hover:border-red-400 hover:text-red-300 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Dashboard Grid - Leave Balances */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              title: "Total Yearly",
              value: totalAllowed,
              unit: "days",
              borderColor: "border-glass-border/70",
              hoverBorderColor: "hover:border-cyan/40",
              valueColor: "text-white",
              progressBarColor: "bg-ocean",
            },
            {
              title: "Approved Days",
              value: daysTaken,
              unit: "taken",
              progressPercent: (daysTaken / totalAllowed) * 100,
              borderColor: "border-foam/25",
              hoverBorderColor: "hover:border-foam/50",
              valueColor: "text-foam",
              progressBarColor: "bg-foam",
            },
            {
              title: "Pending Requests",
              value: pendingCount,
              unit: "requests",
              progressPercent: pendingCount > 0 ? 50 : 0,
              borderColor: "border-cyan/25",
              hoverBorderColor: "hover:border-cyan/50",
              valueColor: "text-cyan",
              progressBarColor: "bg-cyan",
            },
            {
              title: "Balance Leaves",
              value: remainingLeaves,
              unit: "remaining",
              progressPercent: (remainingLeaves / totalAllowed) * 100,
              borderColor: "border-sky-400/20",
              hoverBorderColor: "hover:border-sky-400/40",
              valueColor: "text-sky-300",
              progressBarColor: "bg-sky-300",
            },
          ].map((card, index) => (
            <StatCard key={index} {...card} />
          ))}
        </section>

        {/* Leaves Table & Actions Section */}
        <section className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center flex-shrink-0">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <svg
                className="w-5 h-5 text-foam"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              My Leave Logs
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-300 flex items-center gap-2 glow-btn cursor-pointer"
            >
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
                  strokeWidth={2.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Request Leave
            </button>
          </div>

          {/* Table Container */}
          <DataTable
            columns={columns}
            data={paginatedLeaves}
            isLoading={isFetchingLeaves}
            emptyMessage="No leave logs found"
            emptyRenderer={() => (
              <div className="py-10 text-center text-sky-200/40 space-y-2">
                <svg
                  className="w-10 h-10 mx-auto text-sky-200/20"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v2M9 11h6m-6 4h3"
                  />
                </svg>
                <p className="text-sm font-semibold">No leave logs yet</p>
                <p className="text-xs">
                  Submit a leave request above to start your log.
                </p>
              </div>
            )}
            rowActions={(leave) => (
              <button
                onClick={() => handleDeleteLeave(leave.id)}
                disabled={leave.status !== "Pending"}
                className="p-2 hover:bg-red-500/15 text-sky-200/40 hover:text-red-400 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Withdraw Request"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
            rowActionsLabel="Withdraw"
            page={page}
            pageSize={pageSize}
            total={leaves.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 30, 50]}
          />
        </section>
      </div>

      {/* New Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-abyss/85 backdrop-blur-md">
          <div className="w-full max-w-lg glass-card rounded-2xl p-6 border border-glass-border shadow-2xl relative animate-scale-in">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-sky-200/40 hover:text-white transition-colors cursor-pointer"
            >
              <svg
                className="w-6 h-6"
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

            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-foam"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              New Leave Request
            </h3>
            <p className="text-xs text-sky-200/50 mb-6">
              Fill in the log details to send to approval islands.
            </p>

            {/* Form */}
            <form onSubmit={handleCreateLeave} className="space-y-4">
              <InputField
                label="Title / Subject"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual Vacation, Family Event"
                isRequired
                className="bg-abyss/45 border-glass-border rounded-xl text-white placeholder-sky-200/30 focus:border-foam focus:ring-2 focus:ring-foam/20 transition-all text-sm h-11"
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-sky-200/70 mb-2">
                  Detailed Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you need this leave..."
                  rows={3}
                  className="w-full px-4 py-3 bg-abyss/45 border border-glass-border rounded-xl text-white placeholder-sky-200/30 focus:outline-none focus:border-foam focus:ring-2 focus:ring-foam/20 transition-all text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  isRequired
                  className="bg-abyss/45 border-glass-border rounded-xl text-white placeholder-sky-200/30 focus:border-foam focus:ring-2 focus:ring-foam/20 transition-all text-sm cursor-pointer h-11"
                />
                <InputField
                  label="End Date (Optional)"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-abyss/45 border-glass-border rounded-xl text-white placeholder-sky-200/30 focus:border-foam focus:ring-2 focus:ring-foam/20 transition-all text-sm cursor-pointer h-11"
                />
              </div>

              {/* Submit / Cancel buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-glass-border/30 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-glass-border text-sky-200/70 hover:text-white transition-all text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-300 flex items-center justify-center glow-btn cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? "Submitting..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
