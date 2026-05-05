import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <div className="flex-grow pb-[104px] md:pb-0">{children}</div>
      <Footer />
    </div>
  )
}
