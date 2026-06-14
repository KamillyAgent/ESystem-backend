import { requireUser, isAdmin } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser('/admin');
  if (!isAdmin(user, process.env.ADMIN_EMAIL)) {
    // Don't leak existence of admin panel
    redirect("/dashboard");
  }
  return <>{children}</>;
}
