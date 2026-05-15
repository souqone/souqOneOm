import SubNavBar from '@/components/layout/SubNavBar'
import HeroSection from '@/features/transport/components/HeroSection'
import { ListingSearchBar } from '@/components/shared/listing-search-bar'
import ServiceTypesGrid from '@/features/transport/components/ServiceTypesGrid'
import LatestRequests from '@/features/transport/components/LatestRequests'
import HowItWorks from '@/features/transport/components/HowItWorks'
import CarrierCTA from '@/features/transport/components/CarrierCTA'

export default function TransportLandingPage() {
  return (
    <>
      <SubNavBar />
      {/* ── Hero Section ── */}
      <HeroSection />

      {/* ── Search Bar ── */}
      <ListingSearchBar
        categories={[{
          key: 'transport',
          label: 'نقل',
          route: '/transport/browse',
          subcategories: [
            { key: 'requests', label: 'طلبات النقل',   route: '/transport/browse'            },
            { key: 'new',      label: 'أنشئ طلب نقل', route: '/transport/new'               },
            { key: 'carriers', label: 'مزودو النقل',   route: '/transport/carriers/register' },
          ],
        }]}
        defaultCat="transport"
        addListingHref="/transport/new"
        addListingLabel="أنشئ طلب نقل"
      />

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
