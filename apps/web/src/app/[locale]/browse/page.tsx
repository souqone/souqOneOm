import { redirect } from 'next/navigation'

// Temporarily redirect /browse to /cars/browse until "الكل" tab is implemented
export default function BrowsePage() {
  redirect('/cars/browse')
}
