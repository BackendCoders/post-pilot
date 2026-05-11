import NavBar from '@/components/navbar';
import Footer from '@/components/footer';
import { Search, ArrowRight, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const blogs = [
  {
    id: "ai-social-media-2024",
    title: "How AI is Transforming Social Media Management",
    excerpt: "Discover the latest trends in AI-driven content creation and scheduling that are saving businesses hours every week.",
    category: "AI & Automation",
    author: "Sarah Johnson",
    date: "May 10, 2024",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: "seo-strategies-b2b",
    title: "10 SEO Strategies for B2B Growth in 2024",
    excerpt: "Learn how to optimize your website for high-intent keywords and outrank your competitors in search results.",
    category: "SEO",
    author: "Michael Chen",
    date: "May 08, 2024",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: "lead-gen-masterclass",
    title: "Mastering Lead Generation with Intelligent Data",
    excerpt: "A deep dive into using map data and intent signals to identify and convert high-quality B2B leads.",
    category: "Sales",
    author: "Emma Williams",
    date: "May 05, 2024",
    readTime: "12 min read",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: "future-of-work",
    title: "The Future of Work: Autonomous Workspaces",
    excerpt: "Exploring how integrated toolsets and AI agents are redefining the way we collaborate and execute projects.",
    category: "Productivity",
    author: "David Miller",
    date: "May 02, 2024",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop"
  }
];

const BlogsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <NavBar />
      
      <main className="max-w-[1100px] mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
             <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-[12px] font-bold uppercase tracking-wider"
              >
                Journal
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Insights & Articles</h1>
              <p className="text-muted-foreground text-lg">Exploring the intersection of AI, growth, and automation.</p>
          </div>
          
          <div className="relative w-full md:w-80">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <input 
                type="text" 
                placeholder="Search articles..."
                className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
             />
          </div>
        </div>

        {/* Featured Post */}
        <div 
           className="group relative bg-card border border-border rounded-[32px] overflow-hidden mb-16 cursor-pointer hover:border-primary/20 transition-all shadow-sm"
           onClick={() => navigate(`/blogs/${blogs[0].id}`)}
        >
          <div className="grid md:grid-cols-2">
             <div className="aspect-[16/10] md:aspect-auto overflow-hidden">
                <img 
                   src={blogs[0].image} 
                   alt={blogs[0].title}
                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
             </div>
             <div className="p-8 md:p-12 flex flex-col justify-center space-y-6">
                <div className="flex items-center gap-4 text-xs font-semibold text-primary uppercase tracking-widest">
                   <span className="bg-primary/10 px-2 py-0.5 rounded">{blogs[0].category}</span>
                   <span className="text-muted-foreground">•</span>
                   <span className="text-muted-foreground uppercase">{blogs[0].readTime}</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight leading-tight group-hover:text-primary transition-colors">
                   {blogs[0].title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                   {blogs[0].excerpt}
                </p>
                <div className="flex items-center gap-3 pt-4">
                   <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center">
                      <User size={18} className="text-muted-foreground" />
                   </div>
                   <div className="text-sm">
                      <div className="font-bold">{blogs[0].author}</div>
                      <div className="text-muted-foreground text-xs">{blogs[0].date}</div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {blogs.slice(1).map((blog, idx) => (
            <div 
               key={idx} 
               className="group flex flex-col bg-card border border-border rounded-3xl overflow-hidden cursor-pointer hover:border-primary/20 transition-all hover:shadow-lg hover:shadow-black/5"
               onClick={() => navigate(`/blogs/${blog.id}`)}
            >
               <div className="aspect-[16/9] overflow-hidden">
                  <img 
                    src={blog.image} 
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
               </div>
               <div className="p-6 flex flex-col flex-grow space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                     <span className="text-primary">{blog.category}</span>
                     <span>{blog.readTime}</span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight leading-snug group-hover:text-primary transition-colors">
                     {blog.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                     {blog.excerpt}
                  </p>
                  <div className="mt-auto pt-4 flex items-center gap-2 text-sm font-semibold text-primary">
                     Read Article <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
               </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-20 flex justify-center">
           <button className="px-8 py-3 rounded-xl border border-border bg-card font-medium text-sm transition-all hover:bg-muted active:scale-95">
              Load More Articles
           </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogsPage;
