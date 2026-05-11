import NavBar from '@/components/navbar';
import Footer from '@/components/footer';
import { ShieldCheck } from 'lucide-react';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <NavBar />
      
      <main className="max-w-[800px] mx-auto px-6 pt-32 pb-20">
        <div className="space-y-8 mb-16">
           <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
              <ShieldCheck size={24} />
           </div>
           <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Privacy Policy</h1>
           <p className="text-muted-foreground">Last updated: May 11, 2024</p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-12 text-muted-foreground leading-relaxed">
           <section className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">1. Information We Collect</h2>
              <p>We collect information you provide directly to us when you create an account, use our tools, or communicate with us. This may include your name, email address, payment information, and any data you input into our social media, SEO, or lead generation tools.</p>
           </section>

           <section className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                 <li>Provide, maintain, and improve our Service.</li>
                 <li>Process transactions and send related information.</li>
                 <li>Send you technical notices, updates, security alerts, and support messages.</li>
                 <li>Communicate with you about products, services, offers, and events.</li>
              </ul>
           </section>

           <section className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">3. Sharing of Information</h2>
              <p>We do not share your personal data with third parties except as described in this policy, such as with your consent or with service providers who perform services on our behalf (e.g., payment processing).</p>
           </section>

           <section className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">4. Data Security</h2>
              <p>We use reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
           </section>

           <section className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">5. Your Choices</h2>
              <p>You may update or correct your account information at any time by logging into your account. You can also request to delete your account or opt-out of promotional communications.</p>
           </section>

           <section className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">6. Cookies</h2>
              <p>Most web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove or reject browser cookies.</p>
           </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
