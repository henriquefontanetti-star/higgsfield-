'use client';

import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <Dashboard />;
}
