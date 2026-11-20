import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'My Brew Log', description: '커피 추출 레시피와 시음 기록' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#3b2a20' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="ko"><body>{children}</body></html>);
}
