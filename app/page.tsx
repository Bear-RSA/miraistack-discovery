import Page from '@/components/Page';
import Topbar from '@/components/Topbar';
import Footer from '@/components/Footer';
import ServiceCards from '@/components/ServiceCards';

export default function LandingPage() {
  return (
    <Page>
      <Topbar />
      <div className="hero">
        <h1 className="display-xl">What would you like<br /><span className="accent">Mirai Stack</span> to build?</h1>
        <p className="body-l">Answer a few questions about your business and we&apos;ll scope your project, recommend the right service tier, and prepare for a productive first conversation — before we even meet.</p>
        <p className="hint caption">Choose a service to begin. About three minutes.</p>
      </div>
      <ServiceCards />
      <Footer />
    </Page>
  );
}
