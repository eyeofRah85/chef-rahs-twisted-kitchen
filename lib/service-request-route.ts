type RedirectSearchParams = Record<string, string>;

export function readServiceRequestEventDate(formData: FormData) {
  const existingEventDate = String(formData.get("eventDate") ?? "").trim();

  if (existingEventDate) {
    return existingEventDate;
  }

  const date = String(formData.get("eventDateDate") ?? "").trim();
  const time = String(formData.get("eventDateTime") ?? "").trim();

  if (!date && !time) {
    return "";
  }

  return `${date}T${time}`;
}

export function serviceRequestRedirect(
  path: string,
  searchParams?: RedirectSearchParams,
) {
  const query = searchParams
    ? new URLSearchParams(searchParams).toString()
    : "";
  const location = query ? `${path}?${query}` : path;

  return new Response(null, {
    status: 303,
    headers: {
      "Cache-Control": "no-store",
      Location: location,
    },
  });
}
