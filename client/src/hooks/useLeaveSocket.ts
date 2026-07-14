import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useDispatch } from "react-redux";
import { leaveApi } from "@/store/action";
import { LEAVE_API_HOST } from "../constant/constant";

let socket: Socket | null = null;

export default function useLeaveSocket(userId: string | undefined, role?: string) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!userId || !role) return;

    socket = io(`${LEAVE_API_HOST}/leave`, {
      query: { userId, role },
      withCredentials: true,
    });

    socket.on("leaveUpdate", (leave) => {
      dispatch(leaveApi.util.invalidateTags(["Leave"]));
    });

    socket.on("leaveCreate", (leave) => {
      dispatch(leaveApi.util.invalidateTags(["Leave"]));
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [userId, role, dispatch]);
}
