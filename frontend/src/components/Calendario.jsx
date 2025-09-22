import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export default function CalendarFull() {
  const [selected, setSelected] = useState();

  return (
    <div className="flex flex-col items-center p-6">
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={setSelected}
        className="rounded-lg shadow-md p-4 bg-white"
      />
      {selected && (
        <p className="mt-2 text-sm text-gray-600">
          Seleccionaste: {selected.toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
