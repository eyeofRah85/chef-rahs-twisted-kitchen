export function isTerminalServiceRequestStatus(
  status: string | null | undefined,
) {
  return status === "COMPLETED" || status === "CANCELLED";
}

export function canEditServiceRequestQuote({
  approvalStatus,
  depositPaid,
  status,
}: {
  approvalStatus: string | null | undefined;
  depositPaid: boolean;
  status: string | null | undefined;
}) {
  return (
    approvalStatus !== "DENIED" &&
    !depositPaid &&
    !isTerminalServiceRequestStatus(status)
  );
}

export function canMarkServiceRequestDepositPaid({
  approvalStatus,
  depositAmount,
  depositPaid,
  status,
}: {
  approvalStatus: string | null | undefined;
  depositAmount: number | null;
  depositPaid: boolean;
  status: string | null | undefined;
}) {
  return (
    approvalStatus !== "DENIED" &&
    depositAmount !== null &&
    depositAmount > 0 &&
    !depositPaid &&
    !isTerminalServiceRequestStatus(status)
  );
}
