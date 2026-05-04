import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import HeroSection from './components/HeroSection';
import StatsBar from './components/StatsBar';
import ServiceTypesGrid from './components/ServiceTypesGrid';
import LatestRequests from './components/LatestRequests';
import CarrierCTA from './components/CarrierCTA';
import HowItWorks from './components/HowItWorks';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
      <Navbar />
      <main>
        <HeroSection />
        <StatsBar />
        <ServiceTypesGrid />
        <LatestRequests />
        <HowItWorks />
        <CarrierCTA />
      </main>
      <Footer />
      <BottomNav />
      {/* Bottom nav spacer on mobile */}
      <div className="h-16 md:hidden" />
    </div>
  );
}