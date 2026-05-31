import { redirect } from 'next/navigation';

export default function InventoryCatchAllRedirectPage() {
  redirect('/accommodation/overview');
}
