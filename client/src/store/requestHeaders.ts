"use client";

export const getHeaders = (customHeaders = {}) => {
    const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
        return {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...customHeaders,
        };
    } else {
        return {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
            ...customHeaders,
        };
    }
};

export const getHeadersWithoutContentType = (customHeaders = {}) => {
    const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
        return {
            ...customHeaders,
        };
    } else {
        return {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            ...customHeaders,
        };
    }
};
