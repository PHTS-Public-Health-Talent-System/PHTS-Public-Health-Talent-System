import type { RequestWithDetails } from "@/types/request.types"

export const sortRequestsByCreatedAtDesc = (
  items: RequestWithDetails[] = [],
) => {
  return [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}
