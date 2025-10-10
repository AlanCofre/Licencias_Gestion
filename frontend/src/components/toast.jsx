import React, { useEffect } from "react";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // se cierra solo a los 3s
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div
        className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white animate-slide-up 
          ${type === "success" ? "bg-green-600" : "bg-red-600"}`}
      >
        {type === "success" ? (
          <CheckCircleIcon className="h-5 w-5" />
        ) : (
          <XCircleIcon className="h-5 w-5" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
}
