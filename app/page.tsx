import { Suspense } from 'react';
import InventoryApp from './components/InventoryApp';

export default function Home() {
  return (
    <main>
      <Suspense fallback={<div style={{ padding: '40px', fontFamily: 'sans-serif' }}>Loading system dashboard...</div>}>
        <InventoryApp />
      </Suspense>
    </main>
  );
}
