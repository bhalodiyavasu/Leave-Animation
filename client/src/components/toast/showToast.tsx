import toast from "react-hot-toast";
import { CircleCheck, CircleX, Info, TriangleAlert, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

const typeConfig = {
  success: {
    icon: <CircleCheck size={18} />,
    wrapper: "bg-green-100 border border-green-300 text-green-800",
    iconClass: "text-green-600",
  },
  error: {
    icon: <CircleX size={18} />,
    wrapper: "bg-red-100 border border-red-300 text-red-800",
    iconClass: "text-red-600",
  },
  info: {
    icon: <Info size={18} />,
    wrapper: "bg-blue-100 border border-blue-300 text-blue-800",
    iconClass: "text-blue-600",
  },
  warning: {
    icon: <TriangleAlert size={18} />,
    wrapper: "bg-yellow-100 border border-yellow-300 text-yellow-800",
    iconClass: "text-yellow-600",
  },
};

export const showToast = (type: ToastType, message: string) => {
  if (!message) return;

  const { icon, wrapper, iconClass } = typeConfig[type];

  toast.custom((t) => (
    <div
      className={`flex flex-col items-start gap-1 w-auto min-w-[250px] max-w-sm px-4 py-2.5 rounded-lg shadow-md cursor-pointer ${wrapper} ${t.visible ? "toast-enter" : "toast-leave"
        }`}
      onClick={() => toast.dismiss(t.id)}
    >
      <div className="w-full flex items-center justify-between gap-2">
        <span className="text-md font-bold capitalize">{type}</span>
        <button
          onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
          className="w-7 h-7 opacity-50 hover:opacity-100 transition-opacity hover:bg-white/40 rounded-sm flex items-center justify-center">
          <X size={15} />
        </button>
      </div>
      <div className="flex items-start gap-2">
        <span className={iconClass}>{icon}</span>
        <p className="text-sm flex-1">{message}</p>
      </div>
    </div>
  ));
};
