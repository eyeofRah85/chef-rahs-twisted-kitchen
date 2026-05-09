export const DELIVERY_FEE = 10;
export const LATE_FEE = 10;

export function isWeekend(date: Date) {
  const day = date.getDay();

  return day === 0 || day === 6;
}

export function getNextSunday() {
  const now = new Date();

  const result = new Date(now);

  result.setHours(12, 0, 0, 0);

  const currentDay = result.getDay();

  const daysUntilSunday =
    currentDay === 0
      ? 7
      : 7 - currentDay;

  result.setDate(
    result.getDate() + daysUntilSunday,
  );

  return result;
}

export function getThursdayCutoff() {
  const nextSunday = getNextSunday();

  const cutoff = new Date(nextSunday);

  cutoff.setDate(cutoff.getDate() - 3);

  cutoff.setHours(17, 0, 0, 0);

  return cutoff;
}

export function isLateOrder() {
  const now = new Date();

  return now > getThursdayCutoff();
}

export function calculateDeliveryFee(
  orderType: string,
) {
  return orderType === "delivery"
    ? DELIVERY_FEE
    : 0;
}

export function calculateLateFee() {
  return isLateOrder()
    ? LATE_FEE
    : 0;
}

export function validateRequestedDate(
  requestedDate: Date,
) {
  if (isWeekend(requestedDate)) {
    return {
      valid: false,
      error:
        "Weekend ordering is unavailable.",
    };
  }

  return {
    valid: true,
  };
}

export function calculateCateringDeposit(
  total: number,
) {
  return total * 0.5;
}