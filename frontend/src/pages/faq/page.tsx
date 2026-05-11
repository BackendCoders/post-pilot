import NavBar from '@/components/navbar';
import Footer from '@/components/footer';
import { Plus, Minus, Search, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    question: "What is PostPilot?",
    answer: "PostPilot is an all-in-one AI-driven workspace designed to automate social media management, SEO optimization, and B2B lead generation using the power of Gemini AI."
  },
  {
    question: "How does the AI post generation work?",
    answer: "Our engine uses Gemini Pro to analyze current trends and your brand voice. It generates high-retention content, including captions, hashtags, and visual suggestions, specifically optimized for each social platform."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use enterprise-grade encryption and follow strict security protocols. We never share your data or use it to train public models without your explicit consent."
  },
  {
    question: "Can I integrate PostPilot with my existing CRM?",
    answer: "Yes, our Pro and Enterprise plans offer native integrations with popular CRMs like HubSpot, Salesforce, and Pipedrive. We also provide API access for custom integrations."
  },
  {
    question: "What kind of support do you offer?",
    answer: "We offer 24/7 email support for all users. Pro users get priority chat support, and Enterprise clients have access to a dedicated account manager."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel or downgrade your plan at any time through your account settings. There are no long-term contracts for our standard plans."
  }
];

const FAQPage = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <NavBar />
      
      <main className="max-w-[800px] mx-auto px-6 pt-32 pb-20">
        <div className="text-center space-y-6 mb-16">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-muted-foreground text-xs font-bold uppercase tracking-wider">
              Knowledge Base
           </div>
           <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Frequently Asked Questions</h1>
           <p className="text-muted-foreground text-lg max-w-xl mx-auto">Everything you need to know about PostPilot and how it can help your business grow.</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-16">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
           <input 
              type="text" 
              placeholder="Search for answers..."
              className="w-full bg-card border border-border rounded-2xl pl-12 pr-4 py-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
           />
        </div>

        {/* Accordion */}
        <div className="space-y-4">
           {faqs.map((faq, idx) => (
              <div 
                 key={idx}
                 className={`bg-card border border-border rounded-2xl overflow-hidden transition-all ${activeIndex === idx ? 'ring-1 ring-primary/20 shadow-lg' : ''}`}
              >
                 <button 
                    onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                 >
                    <span className="font-bold tracking-tight">{faq.question}</span>
                    <div className={`p-1.5 rounded-lg bg-muted text-muted-foreground transition-transform duration-300 ${activeIndex === idx ? 'rotate-180' : ''}`}>
                       {activeIndex === idx ? <Minus size={18} /> : <Plus size={18} />}
                    </div>
                 </button>
                 
                 <AnimatePresence>
                    {activeIndex === idx && (
                       <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                       >
                          <div className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed">
                             {faq.answer}
                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>
           ))}
        </div>

        {/* Still Have Questions? */}
        <div className="mt-20 p-8 bg-muted/50 rounded-3xl border border-border flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                 <MessageCircle size={24} />
              </div>
              <div className="text-left">
                 <h4 className="font-bold">Still have questions?</h4>
                 <p className="text-xs text-muted-foreground">Can't find the answer you're looking for? Reach out to our support team.</p>
              </div>
           </div>
           <button className="px-6 py-2.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl transition-all hover:opacity-90 active:scale-95">
              Contact Support
           </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;
