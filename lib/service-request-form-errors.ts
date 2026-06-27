export const serviceRequestErrorMessages = {
  "missing-contact": "Please add your name and email before submitting.",
  "invalid-email": "Please enter a valid email address before submitting.",
  "invalid-event-date":
    "Please enter a valid event date, or leave it blank so we can confirm timing later.",
  "invalid-guest-count":
    "Please enter the guest count as a whole number greater than zero.",
    "rate-limited": "Too many requests. Please wait a few minutes and try again.",
} as const;

export type ServiceRequestErrorCode =
  keyof typeof serviceRequestErrorMessages;

export function getServiceRequestErrorMessage(errorCode?: string) {
  if (!errorCode || !(errorCode in serviceRequestErrorMessages)) {
    return null;
  }

  return serviceRequestErrorMessages[errorCode as ServiceRequestErrorCode];
}
