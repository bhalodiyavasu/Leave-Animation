import { LEAVE_API_HOST } from "../../../constant/constant";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials } from "../../reducer/auth/authSlice";

export const authApi = createApi({
    reducerPath: "authApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${LEAVE_API_HOST}`,
    }),

    endpoints: (builder: any) => ({
        login: builder.mutation({
            query: (credentials: any) => ({
                url: "/auth/login",
                method: "POST",
                body: credentials,
            }),
            async onQueryStarted(_: any, { dispatch, queryFulfilled }: any) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setCredentials({ token: data.token, user: data.user }));
                } catch (err) {
                    console.log("Login Error:", err);
                }
            },
        }),
        register: builder.mutation({
            query: (userData: any) => ({
                url: "/user",
                method: "POST",
                body: userData,
            }),
        }),
        forgotPassword: builder.mutation({
            query: (data: { email: string }) => ({
                url: "/auth/forgot-password",
                method: "POST",
                body: data,
            }),
        }),
        verifyOtp: builder.mutation({
            query: (data: { email: string; otp: string }) => ({
                url: "/auth/verify-otp",
                method: "POST",
                body: data,
            }),
        }),
        resetPassword: builder.mutation({
            query: (data: { email: string; newPassword: string; confirmPassword: string }) => ({
                url: "/auth/change-password",
                method: "POST",
                body: data,
            }),
        }),
    }),
});

export const {
    useLoginMutation,
    useRegisterMutation,
    useForgotPasswordMutation,
    useVerifyOtpMutation,
    useResetPasswordMutation,
} = authApi;
