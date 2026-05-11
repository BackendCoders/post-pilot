import NavBar from '@/components/navbar';
import Footer from '@/components/footer';
import { ScrollText } from 'lucide-react';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <NavBar />
      
      <main className="max-w-[800px] mx-auto px-6 pt-32 pb-20">
        <div className="space-y-8 mb-16">
           <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
              <ScrollText size={24} />
           </div>
           <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Terms of Service</h1>
           <p className="text-muted-foreground">Last updated: May 11, 2024</p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-12 text-muted-foreground leading-relaxed">
           <section className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">1. Acceptance of Terms</h2>
              <p>By accessing or using PostPilot, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, you do not have permission to use our services.</p>
           </section>

           <section className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">2. User Accounts</h2>
              <p>To use certain features of the Service, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
           </section>

           <section className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">3. Prohibited Activities</h2>
              <p>You agree not to engage in any of the following prohibited activities:</p>
              <ul className="list-disc pl-6 space-y-2">
                 <li>Copying, distributing, or disclosing any part of the Service in any medium.</li>
                 <li>Using any automated system, including "robots," "spiders," or "offline readers," to access the Service.</li>
                 <li>Attempting to interfere with, compromise the system integrity or security, or decipher any transmissions to or from the servers running the Service.</li>
              </ul>
           </section>

           <section className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">4. Intellectual Property</h2>
              <p>The Service and its original content, features, and functionality are and will remain the exclusive property of PostPilot and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of PostPilot.</p>
           </section>

           <section className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">5. Limitation of Liability</h2>
              <p>In no event shall PostPilot, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>
           </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsPage;
