import NavBar from '@/components/navbar';
import Footer from '@/components/footer';
import { Play, FileText, CheckCircle2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const DemoPage = () => {
  const [activeVideo, setActiveVideo] = useState(0);

  const demoVideos = [
    {
      title: "Platform Overview",
      description: "Learn the basics of PostPilot and how to navigate the intelligent workspace.",
      duration: "4:32",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop",
      url: "#" // Placeholder for actual video upload
    },
    {
      title: "Advanced SEO Rocket",
      description: "Deep dive into autonomous keyword optimization and competitor analysis.",
      duration: "6:15",
      thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop",
      url: "#"
    },
    {
      title: "Lead Generation Masterclass",
      description: "How to identify and convert high-intent B2B leads using map data.",
      duration: "8:45",
      thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1000&auto=format&fit=crop",
      url: "#"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <NavBar />
      
      <main className="max-w-[1100px] mx-auto px-6 pt-32 pb-20">
        <div className="text-center space-y-6 mb-16">
           <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[12px] font-bold uppercase tracking-wider"
           >
              Product Tour
           </motion.div>
           <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Experience PostPilot <br/> <span className="text-primary/80">in Action</span></h1>
           <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Watch our detailed guides on how to leverage AI to scale your business effectively.</p>
        </div>

        {/* Main Video Player Area */}
        <div className="grid lg:grid-cols-3 gap-8 mb-20">
           <div className="lg:col-span-2 space-y-6">
              <div className="aspect-video bg-card border border-border rounded-[32px] overflow-hidden relative group shadow-2xl shadow-black/5">
                 <img 
                    src={demoVideos[activeVideo].thumbnail} 
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                    alt="Video Thumbnail"
                 />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <button className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all">
                       <Play size={32} fill="currentColor" />
                    </button>
                 </div>
                 <div className="absolute bottom-6 left-6 right-6 p-6 bg-background/60 backdrop-blur-xl border border-white/10 rounded-2xl flex justify-between items-center">
                    <div>
                       <h3 className="font-bold text-lg">{demoVideos[activeVideo].title}</h3>
                       <p className="text-xs text-muted-foreground">{demoVideos[activeVideo].duration} • HD Quality</p>
                    </div>
                    <div className="flex gap-2">
                       <button className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold">Download Guide</button>
                    </div>
                 </div>
              </div>
              <div className="p-8 bg-card border border-border rounded-[32px] space-y-4">
                 <h2 className="text-2xl font-bold tracking-tight">About this demo</h2>
                 <p className="text-muted-foreground leading-relaxed">
                    {demoVideos[activeVideo].description} This video covers the essential features and workflows to get you up and running in less than 10 minutes.
                 </p>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                    {["Core Workflows", "AI Integration", "Data Management", "Team Collaboration", "API Access", "Custom Reports"].map(tag => (
                       <div key={tag} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 size={16} className="text-primary" />
                          {tag}
                       </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Playlist Side */}
           <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-2">Up Next</h3>
              <div className="space-y-3">
                 {demoVideos.map((video, idx) => (
                    <button 
                       key={idx}
                       onClick={() => setActiveVideo(idx)}
                       className={`w-full text-left p-4 rounded-2xl border transition-all flex gap-4 ${activeVideo === idx ? 'bg-primary/5 border-primary shadow-sm' : 'bg-card border-border hover:bg-muted/50'}`}
                    >
                       <div className="w-24 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative">
                          <img src={video.thumbnail} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                             <Play size={12} fill="white" className="text-white" />
                          </div>
                       </div>
                       <div className="flex flex-col justify-center">
                          <h4 className="text-sm font-bold leading-tight line-clamp-1">{video.title}</h4>
                          <p className="text-[11px] text-muted-foreground mt-1">{video.duration}</p>
                       </div>
                    </button>
                 ))}
              </div>

              {/* Promo Card */}
              <div className="mt-8 p-6 bg-primary rounded-2xl text-primary-foreground space-y-4 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-3xl" />
                 <Sparkles className="w-8 h-8 opacity-50" />
                 <h4 className="font-bold">Ready to try it yourself?</h4>
                 <p className="text-xs opacity-80 leading-relaxed">Join 50k+ professionals scaling their business with AI.</p>
                 <button className="w-full py-3 bg-white text-primary rounded-xl font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Start Free Trial
                 </button>
              </div>
           </div>
        </div>

        {/* Documentation Section */}
        <section className="pt-20 border-t border-border">
           <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left space-y-4">
                 <h2 className="text-3xl font-bold tracking-tight">Need more details?</h2>
                 <p className="text-muted-foreground max-w-md">Our documentation covers every aspect of the platform with technical depth and step-by-step guides.</p>
              </div>
              <button className="px-8 py-4 bg-muted border border-border rounded-xl font-bold flex items-center gap-2 hover:bg-muted/80 active:scale-95 transition-all">
                 Read Documentation <FileText size={18} />
              </button>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default DemoPage;
