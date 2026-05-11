import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import SubNavBar from '@/components/layout/SubNavBar';

export default function EquipmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <SubNavBar />
      <div className="flex-grow pb-[70px] lg:pb-0">{children}</div>
      <Footer />
    </div>
  );
}
