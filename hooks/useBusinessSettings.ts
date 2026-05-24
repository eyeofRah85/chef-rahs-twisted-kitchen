"use client";

import { useEffect, useState } from "react";

type BusinessSettings = {
  deliveryFee: number;
  lateFee: number;
  cateringDepositPercent: number;
  orderCutoffDay: number;
  orderCutoffHour: number;
  orderCutoffMinute: number;
  noWeekendOrdering: boolean;
  deliveryArea: string | null;
};

const defaultSettings: BusinessSettings = {
  deliveryFee: 10,
  lateFee: 10,
  cateringDepositPercent: 50,
  orderCutoffDay: 4,
  orderCutoffHour: 17,
  orderCutoffMinute: 0,
  noWeekendOrdering: true,
  deliveryArea: "Greater Atlanta area",
};

export function useBusinessSettings() {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    async function loadSettings() {
      const response = await fetch("/api/business-settings");

      if (!response.ok) return;

      const data = await response.json();
      setSettings(data);
    }

    loadSettings();
  }, []);

  return settings;
}