import HeroSection from '@/features/transport/components/HeroSection'
import StatsBar from '@/features/transport/components/StatsBar'
import ServiceTypesGrid from '@/features/transport/components/ServiceTypesGrid'
import LatestRequests from '@/features/transport/components/LatestRequests'
import HowItWorks from '@/features/transport/components/HowItWorks'
import CarrierCTA from '@/features/transport/components/CarrierCTA'

export default function TransportLandingPage() {
  return (
    <>
      {/* ── Hero Section ── */}
      <HeroSection />

      {/* ── Stats Bar ── */}
      <StatsBar />

      {/* ── Service Types Grid ── */}
      <ServiceTypesGrid />

      {/* ── Latest Requests ── */}
      <LatestRequests />

      {/* ── How It Works ── */}
      <HowItWorks />

      {/* ── Carrier CTA ── */}
      <CarrierCTA />
    </>
  )
}
