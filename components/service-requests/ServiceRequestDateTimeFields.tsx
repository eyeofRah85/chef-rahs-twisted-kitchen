"use client";

import { useState } from "react";

const serviceRequestTimeOptions = Array.from({ length: 48 }, (_, index) => {
  const totalMinutes = index * 30;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const value = `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const period = hour >= 12 ? "PM" : "AM";

  return {
    value,
    label: `${hour12}:${minute.toString().padStart(2, "0")} ${period}`,
  };
});

type ServiceRequestDateTimeFieldsProps = {
  dateLabel: string;
  helpId: string;
  helpText: string;
  inputClassName: string;
  labelClassName: string;
};

export function ServiceRequestDateTimeFields({
  dateLabel,
  helpId,
  helpText,
  inputClassName,
  labelClassName,
}: ServiceRequestDateTimeFieldsProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  return (
    <fieldset className="min-w-0">
      <legend className={labelClassName}>{dateLabel}</legend>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-bold text-[#6b5a50]">
          Date
          <input
            name="eventDateDate"
            type="date"
            value={date}
            required={Boolean(time)}
            aria-describedby={helpId}
            onChange={(event) => setDate(event.target.value)}
            className={inputClassName}
          />
        </label>

        <label className="block text-xs font-bold text-[#6b5a50]">
          Time
          <select
            name="eventDateTime"
            value={time}
            required={Boolean(date)}
            aria-describedby={helpId}
            onChange={(event) => setTime(event.target.value)}
            className={inputClassName}
          >
            <option value="">Select a time</option>
            {serviceRequestTimeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <span
        id={helpId}
        className="mt-2 block text-xs font-medium text-[#6b5a50]"
      >
        {helpText}
      </span>
    </fieldset>
  );
}
