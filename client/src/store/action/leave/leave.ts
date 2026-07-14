import { LEAVE_API_HOST } from "../../../constant/constant";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface LeaveRequest {
  id: string;
  title: string;
  reason?: string;
  status: string;
  startDate: string;
  endDate: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const leaveApi = createApi({
  reducerPath: "leaveApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${LEAVE_API_HOST}`,
    prepareHeaders: (headers) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ["Leave"],
  endpoints: (builder) => ({
    getLeaves: builder.query<LeaveRequest[], void>({
      query: () => "/leave",
      transformResponse: (response: {
        data: LeaveRequest[];
        pagination: any;
        message: string;
      }) => response.data,
      providesTags: ["Leave"],
    }),
    getAdminLeaves: builder.query<LeaveRequest[], void>({
      query: () => "/leave/admin/all",
      transformResponse: (response: {
        data: LeaveRequest[];
        pagination: any;
        message: string;
      }) => response.data,
      providesTags: ["Leave"],
    }),
    createLeave: builder.mutation<
      LeaveRequest,
      { title: string; reason?: string; startDate: string; endDate?: string }
    >({
      query: (body) => ({
        url: "/leave",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Leave"],
    }),
    deleteLeave: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/leave/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Leave"],
    }),
    updateLeave: builder.mutation<LeaveRequest, { id: string; status: string }>(
      {
        query: ({ id, ...body }) => ({
          url: `/leave/${id}`,
          method: "PATCH",
          body,
        }),
        invalidatesTags: ["Leave"],
      },
    ),
    askCopilot: builder.mutation<
      {
        message: string;
        intent: {
          intent: string;
          action: string;
          confidence: number;
          requiresMoreInfo: boolean;
          question: string | null;
          filters: any;
        };
        data: any;
        notifyLeaveUpdate?: {
          action: string;
          leaveIds: string[];
          updatedCount: number;
        };
        notifyAnalyticsRefresh?: boolean;
      },
      { message: string; history?: Array<{ sender: "user" | "copilot"; text: string; intent?: any }> }
    >({
      query: (body) => ({
        url: "/ai",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetLeavesQuery,
  useGetAdminLeavesQuery,
  useCreateLeaveMutation,
  useDeleteLeaveMutation,
  useUpdateLeaveMutation,
  useAskCopilotMutation,
} = leaveApi;
