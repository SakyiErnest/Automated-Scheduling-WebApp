'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { SchoolProvider } from '@/contexts/SchoolContext';

export default function AuthProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <SchoolProvider>{children}</SchoolProvider>
    </AuthProvider>
  );
}
