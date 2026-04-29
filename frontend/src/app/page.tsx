import HeroSequence from "@/components/HeroSequence";
import TextOverlay from "@/components/TextOverlay";

export default function Home() {
  return (
    <main className="relative h-[400vh] bg-black selection:bg-neon-blue selection:text-black overflow-x-hidden">
      <HeroSequence />
      <TextOverlay />
      
      {/* Immersive Overlay Gradient */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-black opacity-40 z-[5]" />
      
      {/* Background Decorative Accents */}
      <div className="fixed top-0 left-1/4 w-[50vw] h-[50vw] bg-neon-blue/5 blur-[150px] rounded-full -translate-y-1/2 pointer-events-none z-0" />
      <div className="fixed bottom-0 right-1/4 w-[50vw] h-[50vw] bg-neon-purple/5 blur-[150px] rounded-full translate-y-1/2 pointer-events-none z-0" />
    </main>
  );
}

