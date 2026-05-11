import NavBar from '@/components/navbar';
import Footer from '@/components/footer';
import { ArrowLeft, User, Share2, Bookmark, MessageCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const blogs = {
  "ai-social-media-2024": {
    title: "How AI is Transforming Social Media Management",
    category: "AI & Automation",
    author: "Sarah Johnson",
    role: "Senior Product Manager",
    date: "May 10, 2024",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop",
    content: `
      <p>The landscape of social media management is undergoing a seismic shift. Gone are the days of manual scheduling and guesswork. Today, AI-driven tools like PostPilot are empowering businesses to create, schedule, and optimize their social presence with unprecedented efficiency.</p>
      
      <h2>The Rise of Generative AI</h2>
      <p>Generative AI has become the cornerstone of modern content strategies. By leveraging large language models, teams can now generate high-quality captions, hashtags, and even visual concepts in a fraction of the time it used to take.</p>
      
      <blockquote>"AI doesn't replace creativity; it amplifies it by removing the friction of execution."</blockquote>
      
      <h2>Intelligent Scheduling</h2>
      <p>It's not just about what you post, but when you post it. Advanced algorithms now analyze audience behavior in real-time to determine the optimal windows for engagement. This data-driven approach ensures that your content reaches the right eyes at the right time.</p>
      
      <h2>Analyzing Trends</h2>
      <p>AI agents can now monitor global trends across platforms, identifying emerging topics before they go viral. This allows brands to stay ahead of the curve and participate in relevant conversations with speed and precision.</p>
      
      <p>In conclusion, the integration of AI into social media workflows is no longer a luxury—it's a necessity for any brand looking to compete in the digital age.</p>
    `
  }
};

const BlogDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const blog = blogs[id as keyof typeof blogs] || blogs["ai-social-media-2024"]; // Fallback for demo

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <NavBar />
      
      <main className="max-w-[800px] mx-auto px-6 pt-32 pb-20">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/blogs')}
          className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Journal
        </button>

        {/* Article Header */}
        <header className="space-y-8 mb-16">
           <div className="flex items-center gap-4 text-xs font-bold text-primary uppercase tracking-widest">
              <span className="bg-primary/10 px-2 py-0.5 rounded">{blog.category}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{blog.readTime}</span>
           </div>
           
           <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              {blog.title}
           </h1>

           <div className="flex items-center justify-between py-6 border-y border-border">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center">
                    <User size={20} className="text-muted-foreground" />
                 </div>
                 <div>
                    <div className="font-bold">{blog.author}</div>
                    <div className="text-xs text-muted-foreground">{blog.role} • {blog.date}</div>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <button className="p-2.5 rounded-full border border-border hover:bg-muted transition-colors"><Share2 size={18} /></button>
                 <button className="p-2.5 rounded-full border border-border hover:bg-muted transition-colors"><Bookmark size={18} /></button>
              </div>
           </div>
        </header>

        {/* Featured Image */}
        <div className="aspect-[16/9] rounded-[32px] overflow-hidden mb-16 border border-border">
           <img 
              src={blog.image} 
              alt={blog.title}
              className="w-full h-full object-cover"
           />
        </div>

        {/* Article Content */}
        <article 
          className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:p-6 prose-blockquote:rounded-r-2xl prose-img:rounded-2xl"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Footer Actions */}
        <div className="mt-20 pt-12 border-t border-border flex flex-col items-center text-center space-y-6">
           <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
              <MessageCircle size={32} />
           </div>
           <h3 className="text-2xl font-bold tracking-tight">Enjoyed this read?</h3>
           <p className="text-muted-foreground max-w-md">Subscribe to our newsletter to receive the latest insights on AI and automation directly in your inbox.</p>
           <div className="flex w-full max-w-md gap-3">
              <input 
                 type="email" 
                 placeholder="your@email.com"
                 className="flex-grow bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95">
                 Subscribe
              </button>
           </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogDetailPage;
