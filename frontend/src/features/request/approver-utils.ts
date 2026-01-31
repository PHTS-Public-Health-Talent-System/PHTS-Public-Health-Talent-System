export type DisplayScope = { value: string; label: string; type: "UNIT" | "DEPT" }

export const buildScopeOptions = (scopes: DisplayScope[] = []) => {
  const options = scopes.map((scope) => ({
    value: scope.value,
    label: scope.label,
  }))
  return [{ value: "ALL", label: "ทั้งหมด" }, ...options]
}

export const formatRequesterName = (requester?: {
  first_name?: string
  last_name?: string
}) => {
  const first = requester?.first_name?.trim() ?? ""
  const last = requester?.last_name?.trim() ?? ""
  const full = `${first} ${last}`.trim()
  return full || "-"
}

export const isSignatureReadyForApproval = (
  mode: "SAVED" | "NEW",
  hasSaved: boolean,
  hasNew: boolean,
) => {
  if (mode === "SAVED") return hasSaved
  return hasNew
}
