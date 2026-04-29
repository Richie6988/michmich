'use client';

import React from 'react';

export default function CookiesPage() {
  return (
    <article>
      <h1 className="font-display font-extrabold text-3xl text-slate-900 mb-2 tracking-tight">Cookie Policy</h1>
      <p className="text-sm text-slate-500 mb-6">Last updated: April 2026</p>

      <Section title="What are cookies?">
        <p>Cookies are small text files stored on your device when you visit a website. Barry uses cookies (and similar local storage techniques) to keep you signed in, remember your preferences, and analyze how the app is used.</p>
      </Section>

      <Section title="Cookies we set">
        <ul>
          <li><strong>Essential:</strong> session cookies and local storage holding your login state, preferences, payment methods, and in-app balance. Without these, the app cannot function.</li>
          <li><strong>Analytics:</strong> aggregated, anonymous usage statistics to help us improve.</li>
          <li><strong>Functional:</strong> map tiles, language, and accessibility preferences.</li>
        </ul>
      </Section>

      <Section title="Third-party cookies">
        <p>Barry loads map tiles from OpenStreetMap and uses public OSRM endpoints. These services may set their own cookies for caching and abuse prevention. We do not control these cookies; consult the respective providers' policies.</p>
      </Section>

      <Section title="Managing cookies">
        <p>You can clear cookies and local storage in your browser settings at any time. Note that doing so will sign you out and reset your saved preferences.</p>
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
