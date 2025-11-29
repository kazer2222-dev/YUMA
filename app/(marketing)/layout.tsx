import { SmoothScroll } from '@/components/ui/smooth-scroll';
import { NoiseOverlay } from '@/components/ui/noise-overlay';
import '../globals.css';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-[#050505] text-white min-h-screen selection:bg-blue-500/30">
            <SmoothScroll>
                <NoiseOverlay />
                <main className="relative z-10">
                    {children}
                </main>
            </SmoothScroll>
        </div>
    );
}
