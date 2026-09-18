import type { Metadata } from 'next';
import Page from '@/components/Page';
import Topbar from '@/components/Topbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = { title: 'Privacy Policy — Mirai Stack' };

// Content ported verbatim from the original privacy.html.
const P = ({ children, last }: { children: React.ReactNode; last?: boolean }) => (
  <p className="card-desc body" style={last ? undefined : { marginBottom: 10 }}>{children}</p>
);
const UL = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="card-desc body" style={{ marginLeft: 20, marginBottom: 10 }}>{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
);
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="privacy-section"><h2 className="ent-section-title">{title}</h2>{children}</div>
);

export default function PrivacyPage() {
  return (
    <Page>
      <Topbar />
      <div className="privacy-wrap">
        <h1 className="q-title display-l" style={{ marginTop: 20 }}>Privacy Policy</h1>
        <p className="q-help body">Effective Date: March 2026</p>

        <Section title="1. INTRODUCTION AND SCOPE">
          <P>1.1 Mirai Stack (Pty) Ltd (&quot;Mirai Stack,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy and ensuring the lawful processing of your Personal Information in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA) and other applicable South African legislation.</P>
          <P>1.2 This Privacy Policy applies to all Personal Information processed by Mirai Stack in connection with:</P>
          <UL items={[
            'Our Project Discovery questionnaire;',
            'Client software projects developed for external organizations;',
            'Our website at www.miraistack.co.za;',
            'All software engineering, platform architecture, and digital infrastructure services we provide;',
            'Any other interactions where we collect, use, store, or process your Personal Information.',
          ]} />
          <P>1.3 This Privacy Policy explains what Personal Information we collect, how and why we collect, use, store, and process your Personal Information, your rights, how we protect your Personal Information, and how to contact us.</P>
          <P>1.4 By accessing our Platforms, using our Services, or providing your Personal Information to us, you acknowledge that you have read and understood this Privacy Policy and consent to the processing of your Personal Information as described herein.</P>
        </Section>

        <Section title="2. DEFINITIONS AND INTERPRETATION">
          <P>2.1 In this Privacy Policy, unless the context otherwise requires:</P>
          <UL items={[
            <><strong>Data Subject:</strong> The person to whom Personal Information relates, being you as the user.</>,
            <><strong>Information Officer:</strong> The person designated by Mirai Stack to oversee POPIA compliance.</>,
            <><strong>Personal Information:</strong> Information relating to an identifiable, living, natural person.</>,
            <><strong>Processing:</strong> Any operation concerning Personal Information, including collection, storage, and use.</>,
            <><strong>Responsible Party:</strong> Mirai Stack.</>,
          ]} />
        </Section>

        <Section title="3. LEGAL BASIS AND COMPLIANCE FRAMEWORK">
          <P>3.1 Mirai Stack processes Personal Information in compliance with POPIA, ECTA, CPA, PAIA, and other relevant South African laws.</P>
          <P last>3.2 We adhere to principles of Accountability, Processing Limitation, Purpose Specification, Further Processing Limitation, Information Quality, Openness, Security Safeguards, and Data Subject Participation.</P>
        </Section>

        <Section title="4. INFORMATION OFFICER AND CONTACT DETAILS">
          <P>4.1 Contact Details:<br />Email: info@miraistack.co.za<br />Physical Address: Durban, South Africa</P>
          <P last>4.2 For all privacy-related inquiries, requests, or complaints, please contact the Information Officer.</P>
        </Section>

        <Section title="5. PERSONAL INFORMATION WE COLLECT">
          <P>5.1 Categories of Personal Information Collected through the Discovery Questionnaire:</P>
          <UL items={[
            <><strong>Identity and Contact Information:</strong> Full name and surname, email address, telephone number, and business details.</>,
            <><strong>Project Information:</strong> Business challenges, project requirements, budget ranges, and other information voluntarily provided in the questionnaire.</>,
            <><strong>Technical and Usage Information:</strong> IP address, device type, browser type, and location data.</>,
          ]} />
          <P last>5.2 We do not collect Special Personal Information unless specifically required and with explicit consent.</P>
        </Section>

        <Section title="6. HOW WE COLLECT PERSONAL INFORMATION">
          <P>6.1 Direct Collection: We collect Personal Information directly from you when you complete the Project Discovery questionnaire or contact our support.</P>
          <P last>6.2 Automated Collection: We automatically collect certain information through cookies, analytics tools, and server logs.</P>
        </Section>

        <Section title="7. PURPOSE OF PROCESSING PERSONAL INFORMATION">
          <P>7.1 We process your Personal Information for the following specific purposes:</P>
          <UL items={[
            'To analyze your project needs and scope your potential project;',
            'To recommend the right service tier and prepare for a productive first conversation;',
            'To communicate with you regarding your inquiry;',
            'To improve our Services and user experience.',
          ]} />
        </Section>

        <Section title="8. LEGAL BASIS FOR PROCESSING">
          <P last>8.1 We process Personal Information when a valid legal basis exists under POPIA, including Consent, Contractual Necessity, Legal Obligation, and Legitimate Interests.</P>
        </Section>

        <Section title="9. DATA SUBJECTS UNDER 18 YEARS OF AGE">
          <P last>9.1 Our questionnaire and services are intended for business professionals and are not directed at Children under 18 years of age. We do not knowingly collect Personal Information from Children.</P>
        </Section>

        <Section title="10. DISCLOSURE AND SHARING OF PERSONAL INFORMATION">
          <P>10.1 We may disclose your Personal Information to trusted third-party service providers (e.g., cloud hosting, analytics) who assist us in operating the questionnaire and our business.</P>
          <P>10.2 We may also disclose information to legal authorities when required by law.</P>
          <P last>10.3 We do not sell your Personal Information to third parties.</P>
        </Section>

        <Section title="11. CROSS-BORDER TRANSFERS">
          <P last>11.1 We may transfer your Personal Information to recipients in other countries (such as cloud hosting services). Cross-border transfers are conducted only when the recipient country has adequate data protection laws or we have implemented appropriate safeguards.</P>
        </Section>

        <Section title="12. DATA SECURITY MEASURES">
          <P last>12.1 Mirai Stack implements appropriate technical and organizational measures (such as encryption and access controls) to ensure the security, integrity, and confidentiality of your Personal Information.</P>
        </Section>

        <Section title="13. DATA RETENTION AND DESTRUCTION">
          <P last>13.1 We retain your Personal Information only for as long as necessary to fulfill the purposes for which it was collected, to communicate with you about your project, or as required by Applicable Law.</P>
        </Section>

        <Section title="14. YOUR RIGHTS AS A DATA SUBJECT">
          <P>14.1 Under POPIA, you have the right of Access, Correction, Objection, Withdrawal of Consent, and Data Portability.</P>
          <P last>14.2 To exercise any of these rights, contact the Information Officer at info@miraistack.co.za.</P>
        </Section>

        <Section title="15. COOKIES AND SIMILAR TECHNOLOGIES">
          <P last>15.1 We use cookies and similar tracking technologies to enhance your experience, analyze usage, and deliver personalized content.</P>
        </Section>

        <Section title="16. BREACH NOTIFICATION, CHANGES & COMPLAINTS">
          <P>16.1 We have procedures to detect, assess, and respond to Personal Information security breaches and will notify the Information Regulator and affected Data Subjects as required.</P>
          <P>16.2 We may update this Privacy Policy from time to time. Changes will be posted on our website.</P>
          <P last>16.3 If you have complaints regarding our handling of your data, you may contact our Information Officer, or the Information Regulator at inforeg@justice.gov.za.</P>
        </Section>

        <div className="privacy-section" style={{ marginTop: 40, borderTop: '1px solid var(--line)', paddingTop: 20 }}>
          <p className="card-desc body" style={{ fontSize: 11, letterSpacing: 0.5, opacity: 0.8 }}>BY USING MIRAI STACK PLATFORMS AND SERVICES, YOU ACKNOWLEDGE THAT YOU HAVE READ AND UNDERSTOOD THIS PRIVACY POLICY AND CONSENT TO THE PROCESSING OF YOUR PERSONAL INFORMATION AS DESCRIBED HEREIN.</p>
          <p className="card-desc body" style={{ fontSize: 11, letterSpacing: 0.5, opacity: 0.8, marginTop: 10 }}>© 2026 Mirai Stack (Pty) Ltd. All rights reserved.</p>
        </div>
      </div>
      <Footer linkHref="/" linkLabel="Back to Home" />
    </Page>
  );
}
