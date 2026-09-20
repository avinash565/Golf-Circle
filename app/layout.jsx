import './globals.css';
import { Toaster } from 'react-hot-toast';
import Nav from '@/components/Nav';

export const metadata = { title: 'GolfCircle', description: 'Golf, rewards and charity.' };

export default function RootLayout({ children }) {
  return <html lang="en">
    <body>
      <Nav/>
      <main>
        <Toaster position="top-right" />
        {children}
      </main>
    </body>
  </html>;
}
