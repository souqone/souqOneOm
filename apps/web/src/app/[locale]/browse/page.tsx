import { redirect } from 'next/navigation'

// Temporarily redirect /browse to /browse/cars until "الكل" tab is implemented
export default function BrowsePage() {
  redirect('/browse/cars')
}
