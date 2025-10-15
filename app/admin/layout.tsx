import type { Metadata } from "next";
import { AdminProvider } from "@/lib/admin/AdminContext";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://splittra.app";

export const metadata: Metadata = {
  title: "Admin Dashboard - Splittra",
  description: "Administrative dashboard for Splittra expense sharing platform",
  metadataBase: new URL(siteUrl),
  robots: { index: false, follow: false },
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