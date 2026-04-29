'use client';

import React from 'react';

export default function TermsPage() {
  return (
    <article>
      <h1 className="font-display font-extrabold text-3xl text-slate-900 mb-2 tracking-tight">Terms and Conditions</h1>
      <p className="text-sm text-slate-500 mb-6">Last updated: April 2026</p>

      <Section title="1. About Barry">
        <p>Barry is a service operated by Barry SAS (the "Service") that helps groups of people find equitable meeting points and coordinate trips. By accessing or using the Service, you agree to be bound by these Terms.</p>
      </Section>

      <Section title="2. Eligibility and account">
        <p>You must be at least 18 years old to create an account. You are responsible for keeping your credentials confidential and for all activities under your account. Notify us immediately of any unauthorized use.</p>
      </Section>

      <Section title="3. Use of the Service">
        <p>You agree to use Barry only for lawful purposes. You must not:</p>
        <ul>
          <li>Submit false information about identity, location, or payment</li>
          <li>Disrupt, reverse-engineer, or attempt unauthorized access to the Service</li>
          <li>Use Barry to harass, defraud, or harm other users</li>
          <li>Scrape, automate, or otherwise abuse the Service infrastructure</li>
        </ul>
      </Section>

      <Section title="4. Payments and balance">
        <p>Top-ups to your in-app balance are processed by a third-party payment provider. Funds in your in-app balance can be used for trip-related expenses on Barry. Refunds and payouts are subject to applicable laws and our Refund Policy.</p>
        <p>For prototype/demo deployments, no real charge is made. For production deployments, you authorize Barry to charge your selected payment method for amounts you confirm in the app.</p>
      </Section>

      <Section title="5. Bookings via Barry">
        <p>When Barry connects you to third-party services (restaurants, hotels, transport, etc.), the booking contract is between you and that third party. Barry is not responsible for the quality, availability, or pricing of partner services.</p>
      </Section>

      <Section title="6. Equity calculation and recommendations">
        <p>The fairness scores, suggested meeting points, and route estimates Barry provides are computed from public data sources (OpenStreetMap, OSRM) and your inputs. They are best-effort recommendations, not guarantees. Travel times and costs may vary in real life.</p>
      </Section>

      <Section title="7. User content">
        <p>Messages, expenses, and votes you submit remain your property. You grant Barry a non-exclusive license to host, display, and transmit this content as needed to operate the Service. We may remove content that violates these Terms.</p>
      </Section>

      <Section title="8. Liability">
        <p>To the fullest extent permitted by law, Barry is not liable for indirect, incidental, or consequential damages. Our total liability for any claim is limited to the amounts paid by you to Barry in the 12 months preceding the claim.</p>
      </Section>

      <Section title="9. Termination">
        <p>You can stop using Barry at any time and request account deletion. We may suspend or terminate access if these Terms are breached.</p>
      </Section>

      <Section title="10. Changes to these Terms">
        <p>We may update these Terms from time to time. Material changes will be notified in-app or by email at least 30 days before they take effect.</p>
      </Section>

      <Section title="11. Governing law">
        <p>These Terms are governed by the laws of France. Disputes will be resolved by the competent courts of Paris, unless mandatory consumer-protection rules in your country of residence provide otherwise.</p>
      </Section>

      <Section title="12. Contact">
        <p>Questions? Reach us at <a href="mailto:hello@barry.app" className="text-barry-blue font-medium">hello@barry.app</a>.</p>
      </Section>

      <p className="text-xs text-slate-500 mt-8 leading-relaxed">
        These Terms are a prototype draft for the Barry application. They are not a substitute for proper legal advice and should be reviewed by qualified counsel before any commercial deployment.
      </p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="font-display font-bold text-lg text-slate-900 mb-2 tracking-tight">{title}</h2>
      <div className="text-sm text-slate-700 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}
