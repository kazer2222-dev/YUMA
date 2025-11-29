import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - YUMA',
  description: 'Sign in or create an account to access YUMA',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0a0a14',
        overflow: 'auto',
      }}
    >
      {children}
    </div>
  );
}

