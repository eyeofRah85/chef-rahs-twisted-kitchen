export const approvalStatuses = ["PENDING", "APPROVED", "DENIED"] as const;
export type ApprovalStatusValue = (typeof approvalStatuses)[number];

export const userRoles = ["CUSTOMER", "ADMIN", "OWNER"] as const;
export type UserRoleValue = (typeof userRoles)[number];

export const orderStatuses = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
] as const;
export type OrderStatusValue = (typeof orderStatuses)[number];

export const orderTypes = ["DELIVERY", "PICKUP", "CATERING"] as const;
export type OrderTypeValue = (typeof orderTypes)[number];

export const menuItemTypes = [
  "PLATE",
  "A_LA_CARTE",
  "MEAL_PLAN",
  "CATERING",
  "DESSERT",
  "SIDE",
  "OTHER",
] as const;
export type MenuItemTypeValue = (typeof menuItemTypes)[number];

export const cateringStatuses = [
  "NEW",
  "REVIEWING",
  "QUOTED",
  "APPROVED",
  "DEPOSIT_DUE",
  "DEPOSIT_PAID",
  "COMPLETED",
  "CANCELLED",
] as const;
export type CateringStatusValue = (typeof cateringStatuses)[number];

export const serviceRequestTypes = ["CATERING", "PERSONAL_CHEF"] as const;
export type ServiceRequestTypeValue = (typeof serviceRequestTypes)[number];
