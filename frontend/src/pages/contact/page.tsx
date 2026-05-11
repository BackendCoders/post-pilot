import NavBar from '@/components/navbar';
import Footer from '@/components/footer';
import { Mail, MessageSquare, Phone, MapPin, Send, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <NavBar />
      
      <main className="max-w-[1100px] mx-auto px-6 pt-32 pb-20">
        <div className="grid md:grid-cols-2 gap-16">
          {/* Left: Contact Info */}
          <div className="space-y-12">
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted border border-border text-muted-foreground text-[13px] font-medium"
              >
                <MessageSquare className="w-4 h-4 text-primary" />
                Contact Us
              </motion.div>
              
              <h1 className="text-5xl font-bold tracking-tight">
                Let's talk about <br/>
                <span className="text-primary/80">your growth.</span>
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Have questions about our platform or need a custom solution? Our team is here to help you scale.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 transition-colors group-hover:bg-primary group-hover:text-white">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight">Email Us</h3>
                  <p className="text-sm text-muted-foreground">Support: support@postpilot.ai</p>
                  <p className="text-sm text-muted-foreground">Sales: sales@postpilot.ai</p>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 transition-colors group-hover:bg-primary group-hover:text-white">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight">Call Us</h3>
                  <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                  <p className="text-sm text-muted-foreground">Mon-Fri, 9am - 6pm EST</p>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 transition-colors group-hover:bg-primary group-hover:text-white">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight">Visit Us</h3>
                  <p className="text-sm text-muted-foreground">123 Innovation Way, Suite 400</p>
                  <p className="text-sm text-muted-foreground">San Francisco, CA 94105</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-border flex items-center gap-4 text-muted-foreground">
               <Globe className="w-5 h-5" />
               <span className="text-sm font-medium">Available Worldwide</span>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="bg-card border border-border rounded-[32px] p-8 md:p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] pointer-events-none" />
            
            <form className="space-y-6 relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First Name</label>
                  <input 
                    type="text" 
                    placeholder="Jane"
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Name</label>
                  <input 
                    type="text" 
                    placeholder="Doe"
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</label>
                <input 
                  type="email" 
                  placeholder="jane@company.com"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject</label>
                <select className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none">
                  <option>General Inquiry</option>
                  <option>Technical Support</option>
                  <option>Sales Question</option>
                  <option>Partnership</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</label>
                <textarea 
                  rows={4}
                  placeholder="Tell us more about what you're looking for..."
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              <button className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-xl hover:shadow-primary/25 active:scale-[0.98]">
                Send Message <Send className="w-4 h-4" />
              </button>
              
              <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                By submitting this form, you agree to our <button className="text-primary hover:underline">Privacy Policy</button> and <button className="text-primary hover:underline">Terms of Service</button>.
              </p>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
