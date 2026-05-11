import NavBar from '@/components/navbar';
import Footer from '@/components/footer';
import { Target, Users, Zap, Award, Globe, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

const AboutPage = () => {
  const stats = [
    { label: "Active Users", value: "50k+", icon: <Users className="w-5 h-5" /> },
    { label: "Countries", value: "120+", icon: <Globe className="w-5 h-5" /> },
    { label: "AI Generations", value: "10M+", icon: <Zap className="w-5 h-5" /> },
    { label: "Efficiency Boost", value: "85%", icon: <Award className="w-5 h-5" /> },
  ];

  const values = [
    {
      title: "Innovation First",
      description: "We constantly push the boundaries of what's possible with AI and automation.",
      icon: <Rocket className="w-6 h-6 text-primary" />
    },
    {
      title: "User Centric",
      description: "Every feature we build is designed to solve real-world problems for our users.",
      icon: <Target className="w-6 h-6 text-primary" />
    },
    {
      title: "Global Impact",
      description: "Our tools are built to scale businesses regardless of their location or industry.",
      icon: <Globe className="w-6 h-6 text-primary" />
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <NavBar />
      
      <main className="max-w-[1100px] mx-auto px-6 pt-32 pb-20">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted border border-border text-muted-foreground text-[13px] font-medium"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Our Mission
          </motion.div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight balance">
            We're building the future of <br/>
            <span className="text-primary/80">intelligent workspace.</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            PostPilot started with a simple idea: make business automation accessible, intelligent, and seamless for everyone.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-32">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-card border border-border rounded-2xl p-6 text-center space-y-2">
              <div className="mx-auto w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                {stat.icon}
              </div>
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Content Section */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Our Story</h2>
            <p className="text-muted-foreground leading-relaxed">
              Founded in 2024, PostPilot emerged from the need for more cohesive business tools. We noticed that companies were juggling dozens of disconnected apps for social media, SEO, and lead generation.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We decided to build a unified platform that leverages the power of Gemini AI to not just automate tasks, but to provide strategic insights that drive growth.
            </p>
            <div className="pt-4">
              <button className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95">
                Join our journey
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-muted rounded-[32px] overflow-hidden border border-border relative">
                {/* Decorative elements to replace image */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 blur-[80px]" />
                <div className="p-8 h-full flex flex-col justify-end">
                   <div className="bg-background/80 backdrop-blur-md p-6 rounded-2xl border border-border/50 space-y-2">
                      <div className="text-sm font-semibold">PostPilot HQ</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">Designing the next generation of automation tools in a collaborative environment.</div>
                   </div>
                </div>
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Core Values</h2>
            <p className="text-muted-foreground">The principles that guide everything we do.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((val, idx) => (
              <div key={idx} className="bg-card border border-border rounded-3xl p-8 space-y-4 transition-all hover:border-primary/20 hover:shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
                  {val.icon}
                </div>
                <h3 className="text-xl font-bold tracking-tight">{val.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {val.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
