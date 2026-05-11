import { Home, Mail, Github, Twitter, Linkedin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const sections = [
    {
      title: "Product",
      links: [
        { label: "Post Pilot", path: "/post-pilot" },
        { label: "SEO Rocket", path: "/seo-rocket" },
        { label: "Lead Generator", path: "/lead-generator" },
        { label: "Pricing", path: "/pricing" },
      ]
    },
    {
      title: "Resources",
      links: [
        { label: "Blog", path: "/blogs" },
        { label: "Watch Demo", path: "/demo" },
        { label: "Documentation", path: "/docs" },
        { label: "FAQ", path: "/faq" },
        { label: "Support", path: "/contact" },
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About Us", path: "/about" },
        { label: "Careers", path: "/careers" },
        { label: "Contact", path: "/contact" },
        { label: "Partners", path: "/partners" },
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", path: "/privacy" },
        { label: "Terms of Service", path: "/terms" },
        { label: "Cookie Policy", path: "/cookies" },
      ]
    }
  ];

  return (
    <footer className="bg-background border-t border-border mt-20">
      <div className="max-w-[1100px] mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
          {/* Brand Section */}
          <div className="col-span-2 space-y-6">
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                <Home size={18} />
              </div>
              <span className="text-xl font-bold tracking-tight">PostPilot</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Empowering businesses with AI-driven social media, SEO, and lead generation tools. Scale your growth with intelligent automation.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
                <Linkedin size={18} />
              </a>
              <a href="#" className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
                <Github size={18} />
              </a>
              <a href="mailto:support@postpilot.ai" className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Links Sections */}
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <h4 className="text-sm font-semibold tracking-wider uppercase text-foreground/80">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <button 
                      onClick={() => navigate(link.path)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[13px] text-muted-foreground">
            © {currentYear} PostPilot AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <button className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              Status
            </button>
            <button className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              Security
            </button>
            <button className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              English (US)
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
