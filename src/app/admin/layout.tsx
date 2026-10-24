import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Owner console", template: "%s · Owner console" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
