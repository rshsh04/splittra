import type { Metadata } from "next";
import { AdminProvider } from "@/lib/admin/AdminContext";

export const metadata: Metadata = {
  title: "Admin Dashboard - Splittra",
  description: "Administrative dashboard for Splittra expense sharing platform",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      {children}
    </AdminProvider>
  );
}