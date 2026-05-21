import { getApiUser, apiSuccess, apiUnauthorized } from "@/lib/auth";

export async function GET() {
  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  return apiSuccess({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mosqueId: user.mosqueId,
  });
}
