import NavBar from '@/components/navbar';
import { Rocket, Box, Search, ArrowRight, Sparkles, Zap, ShieldCheck, Globe } from 'lucide-react';

/**
 * MD3 "Googlify" Home Page Refactor
 * Layout: Center-aligned typography with wide-track scannability.
 * Style: Material 3 xl (12px) and 3xl (24px) border-radii.
 * Typography: Product Sans-style clean aesthetics.
 */

const HomePage = () => {
  const tools = [
    {
      title: "Post Pilot",
      description: "Automate your social presence with Gemini-powered content scheduling and trend analysis.",
      icon: <Box className="w-6 h-6 text-primary" />,
      link: "/post-pilot",
      tag: "Social"
    },
    {
      title: "SEO Rocket",
      description: "Propel your site to the top of search results using autonomous keyword optimization.",
      icon: <Rocket className="w-6 h-6 text-primary" />,
      link: "/seo-rocket",
      tag: "Growth"
    },
    {
      title: "Lead Generator",
      description: "Intelligently map B2B opportunities by extracting high-intent data from global maps.",
      icon: <Search className="w-6 h-6 text-primary" />,
      link: "/lead-generator",
      tag: "Sales"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10 antialiased">
      <NavBar />

      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-primary/5 blur-[120px] pointer-events-none" />

      <main className="relative max-w-[1100px] mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center">
        
        {/* Hero Section */}
        <header className="max-w-3xl space-y-6 mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted border border-border text-muted-foreground text-[13px] font-medium transition-all hover:bg-muted/80">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Introducing AI-powered automation</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-foreground balance">
            Your workspace, <br/> 
            <span className="text-primary/80">reimagined.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            A suite of intelligent tools designed to scale your business. Choose a module to begin your journey.
          </p>
        </header>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {tools.map((tool, idx) => (
            <a
              key={idx}
              href={tool.link}
              className="group relative flex flex-col items-start text-left bg-card border border-border rounded-[24px] p-8 transition-all duration-300 hover:border-primary/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-[0.97]"
            >
              <div className="mb-6 w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 transition-colors duration-300 hover:bg-primary hover:text-white">
                {tool.icon}
              </div>
              
              <div className="space-y-3 flex-grow">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold tracking-tight">{tool.title}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-bold uppercase tracking-wider text-muted-foreground/80">
                    {tool.tag}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-8 flex items-center gap-2 text-sm font-medium text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                Get started <ArrowRight className="w-4 h-4" />
              </div>
            </a>
          ))}
        </div>

        {/* Home Page "Trust" Indicators (Replacing Dashboard Stats) */}
        <div className="mt-24 pt-12 border-t border-border w-full flex flex-wrap justify-center gap-x-16 gap-y-8 grayscale opacity-60">
          <div className="flex items-center gap-2 text-sm font-medium">
             <ShieldCheck className="w-5 h-5" /> Enterprise Security
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
             <Zap className="w-5 h-5" /> Instant Activation
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
             <Globe className="w-5 h-5" /> Global Infrastructure
          </div>
        </div>

        {/* Primary Action */}
        <div className="mt-20">
          <button className="px-10 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-all hover:shadow-xl hover:shadow-primary/25 active:scale-95">
            Explore All Features
          </button>
        </div>
      </main>
    </div>
  );
};

export default HomePage;