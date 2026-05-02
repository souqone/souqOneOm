import { redirect } from 'next/navigation';

export default function BrowseJobsRedirect() {
  redirect('/jobs');
}
