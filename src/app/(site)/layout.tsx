import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNavbar } from "@/components/layout/site-navbar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNavbar />
      <main className="mx-auto max-w-7xl px-4 pt-6 md:px-6 md:pt-10">{children}</main>
      <SiteFooter />
      <MobileNav />
    </>
  );
}
