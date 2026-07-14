import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { leaveApi } from "@/store/action";
import { LEAVE_API_HOST } from "../constant/constant";

let socket: WebSocket | null = null;

export default function useLeaveSocket(userId: string | undefined, role?: string) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!userId || !role) return;

    const wsUrl = `${LEAVE_API_HOST.replace(/^http/, "ws")}/ws/leave?userId=${encodeURIComponent(userId)}&role=${encodeURIComponent(role)}`;
    socket = new WebSocket(wsUrl);

    socket.onmessage = () => {
      dispatch(leaveApi.util.invalidateTags(["Leave"]));
    };

    return () => {
      socket?.close();
      socket = null;
    };
  }, [userId, role, dispatch]);
}
