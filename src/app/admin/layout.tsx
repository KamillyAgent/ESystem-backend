import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  if (user.email !== process.env.ADMIN_EMAIL) {
    // Don't leak existence of admin panel
    redirect("/dashboard");
  }
  return <>{children}</>;
}
