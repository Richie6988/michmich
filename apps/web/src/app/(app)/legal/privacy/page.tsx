'use client';

import React from 'react';

export default function PrivacyPage() {
  return (
    <article>
      <h1 className="font-display font-extrabold text-3xl text-slate-900 mb-2 tracking-tight">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-6">Last updated: April 2026</p>

      <Section title="What we collect">
        <p>To make Barry work, we collect:</p>
        <ul>
          <li><strong>Account info:</strong> name, email, optional phone</li>
          <li><strong>Trip data:</strong> origins, destinations, preferences, votes, messages, expenses</li>
          <li><strong>Location:</strong> only when you grant browser permission</li>
          <li><strong>Payment data:</strong> stored by our payment provider, not on Barry servers</li>
          <li><strong>Usage data:</strong> diagnostic logs, error reports, basic analytics</li>
        </ul>
      </Section>

      <Section title="How we use it">
        <ul>
          <li>To find fair meeting points and compute travel times</li>
          <li>To enable group features (chat, votes, kitty, expenses)</li>
          <li>To process bookings and payments via our partners</li>
          <li>To improve the Service and prevent abuse</li>
        </ul>
      </Section>

      <Section title="What we share">
        <p>We share data only with: payment processors (to charge you), mapping/routing partners (OpenStreetMap, OSRM), and booking partners (when you book). We never sell your data to advertisers.</p>
      </Section>

      <Section title="Your rights (GDPR)">
        <p>You can access, correct, export, or delete your personal data at any time. Email <a href="mailto:privacy@barry.app" className="text-barry-blue font-medium">privacy@barry.app</a> for any request. We respond within 30 days.</p>
      </Section>

      <Section title="Retention">
        <p>We keep your data while your account is active. After deletion, most data is removed within 30 days; some records (e.g. payment receipts) are kept longer when required by law.</p>
      </Section>

      <Section title="Security">
        <p>We use industry-standard encryption in transit and at rest. No system is perfectly secure: please use a strong password and enable two-factor authentication when available.</p>
      </Section>

      <Section title="Contact">
        <p>Data Protection Officer: <a href="mailto:dpo@barry.app" className="text-barry-blue font-medium">dpo@barry.app</a></p>
      </Section>
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
