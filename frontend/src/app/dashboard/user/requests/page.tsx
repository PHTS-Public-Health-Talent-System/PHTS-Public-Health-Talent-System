import UserRequestsListClient from "./requests-client";

export const dynamic = "force-dynamic";

export default async function UserRequestsListPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string }>;
}) {
  const resolved = await searchParams;
  return (
    <UserRequestsListClient
      initialQuery={resolved?.q ?? ""}
      initialStatus={resolved?.status ?? "ALL"}
    />
  );
}
