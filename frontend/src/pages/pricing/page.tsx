import NavBar from '@/components/navbar';
import Footer from '@/components/footer';
import { Check, Zap, Rocket, Shield, Globe, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const plans = [
  {
    name: "Starter",
    price: "$29",
    description: "Perfect for individuals and small projects.",
    features: [
      "3 Social Media Accounts",
      "50 AI Post Generations",
      "Basic SEO Audit",
      "1,000 Lead Scrapes",
      "Email Support"
    ],
    cta: "Start for free",
    popular: false,
    icon: <Zap className="w-5 h-5" />
  },
  {
    name: "Pro",
    price: "$79",
    description: "Ideal for growing teams and agencies.",
    features: [
      "10 Social Media Accounts",
      "Unlimited AI Generations",
      "Advanced SEO Analysis",
      "10,000 Lead Scrapes",
      "Priority Chat Support",
      "Team Collaboration"
    ],
    cta: "Get Started Pro",
    popular: true,
    icon: <Rocket className="w-5 h-5" />
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Scalable solutions for large organizations.",
    features: [
      "Unlimited Accounts",
      "Custom AI Training",
      "White-label Reports",
      "API Access",
      "Dedicated Account Manager",
      "Custom Integrations"
    ],
    cta: "Contact Sales",
    popular: false,
    icon: <Shield className="w-5 h-5" />
  }
];

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <NavBar />
      
      <main className="max-w-[1100px] mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <div className="text-center space-y-6 mb-20">
           <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[13px] font-bold uppercase tracking-wider border border-primary/20"
           >
              Transparent Pricing
           </motion.div>
           <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Ready to scale <br/> 
              <span className="text-primary/80">your business?</span>
           </h1>
           <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Choose the perfect plan for your needs. No hidden fees, cancel anytime.
           </p>
        </div>

        {/* Billing Toggle (Placeholder) */}
        <div className="flex justify-center mb-16">
           <div className="bg-muted p-1 rounded-xl flex items-center gap-1 border border-border">
              <button className="px-6 py-2 rounded-lg bg-background shadow-sm text-sm font-bold">Monthly</button>
              <button className="px-6 py-2 rounded-lg text-muted-foreground text-sm font-medium">Yearly <span className="text-primary text-[10px] bg-primary/10 px-1.5 py-0.5 rounded ml-1">-20%</span></button>
           </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-32">
           {plans.map((plan, idx) => (
              <div 
                 key={idx}
                 className={`relative flex flex-col bg-card border ${plan.popular ? 'border-primary shadow-xl shadow-primary/5 scale-105 z-10' : 'border-border'} rounded-[32px] p-8 space-y-8 transition-all hover:translate-y-[-4px]`}
              >
                 {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                       Most Popular
                    </div>
                 )}

                 <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${plan.popular ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                       {plan.icon}
                    </div>
                    <div>
                       <h3 className="text-xl font-bold tracking-tight">{plan.name}</h3>
                       <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                    </div>
                 </div>

                 <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tighter">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-muted-foreground text-sm">/month</span>}
                 </div>

                 <ul className="space-y-4 flex-grow">
                    {plan.features.map((feature, fIdx) => (
                       <li key={fIdx} className="flex items-center gap-3 text-sm text-foreground/80">
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${plan.popular ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                             <Check className="w-3 h-3" />
                          </div>
                          {feature}
                       </li>
                    ))}
                 </ul>

                 <button className={`w-full py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${plan.popular ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:opacity-90' : 'bg-muted hover:bg-muted/80 text-foreground'}`}>
                    {plan.cta}
                 </button>
              </div>
           ))}
        </div>

        {/* Feature Comparison Section */}
        <div className="space-y-12">
           <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Every plan includes</h2>
              <p className="text-muted-foreground">Standard features across all tiers.</p>
           </div>
           
           <div className="grid md:grid-cols-4 gap-8">
              {[
                 { title: "Gemini Integration", desc: "Powered by the latest LLMs", icon: <Zap className="w-5 h-5" /> },
                 { title: "Real-time Analytics", desc: "Track performance live", icon: <Globe className="w-5 h-5" /> },
                 { title: "Priority Support", desc: "We're here to help", icon: <Check className="w-5 h-5" /> },
                 { title: "Secure Data", desc: "Enterprise-grade encryption", icon: <Shield className="w-5 h-5" /> },
              ].map((item, idx) => (
                 <div key={idx} className="flex flex-col items-center text-center space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                       {item.icon}
                    </div>
                    <h4 className="font-bold text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                 </div>
              ))}
           </div>
        </div>

        {/* Final CTA */}
        <div className="mt-32 bg-primary rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px]" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 blur-[100px]" />
           
           <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground tracking-tight mb-6">
              Still have questions?
           </h2>
           <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto mb-10">
              Our experts are ready to guide you through our platform and find the best fit for your business.
           </p>
           <button className="px-10 py-4 bg-white text-primary font-bold rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto">
              Schedule a Demo <ArrowRight className="w-4 h-4" />
           </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PricingPage;
