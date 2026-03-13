export const metadata = {
  title: "Privacy Policy – HQ",
};

export default function PrivacyPage() {
  const lastUpdated = "March 13, 2026";
  const appName = "HQ";
  const contactEmail = "privacy@williamhq.com";
  const appUrl = "https://williamhq.com";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">{appName} Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: {lastUpdated}</p>

        <section className="space-y-8 text-sm leading-relaxed text-foreground/80">

          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">1. Overview</h2>
            <p>
              {appName} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is a personal finance tracking application
              available at <a href={appUrl} className="underline">{appUrl}</a>. This Privacy Policy explains what data
              we collect, how we use it, and your rights regarding that data.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">2. Data We Collect</h2>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Account information:</strong> name, email address, and password (stored hashed).</li>
              <li><strong>Financial data:</strong> transactions, budgets, and categories you create within the app.</li>
              <li><strong>WhatsApp phone number:</strong> if you choose to link your number for expense logging via WhatsApp.</li>
              <li><strong>Message content:</strong> text messages sent to our WhatsApp number are processed to extract expense data and are not stored beyond what is needed for deduplication.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">3. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>To provide and operate the {appName} service.</li>
              <li>To process expense entries submitted via WhatsApp messages.</li>
              <li>To send confirmation replies via WhatsApp when an expense is recorded.</li>
              <li>We do not sell, share, or rent your data to third parties.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">4. WhatsApp Integration</h2>
            <p>
              {appName} uses the Meta WhatsApp Cloud API to allow users to log expenses by sending text messages.
              When you send a message to our WhatsApp number, the content is received via Meta&apos;s platform and
              processed solely to create an expense entry in your account. Message IDs are stored to prevent
              duplicate processing. We do not use message content for any other purpose.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">5. Data Storage and Security</h2>
            <p>
              Your data is stored in a secured database. Passwords are hashed and never stored in plain text.
              Access tokens and secrets are stored as environment variables and are never exposed to the client.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. You may request deletion of your account
              and associated data at any time by contacting us.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">7. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data. To exercise these rights,
              contact us at <a href={`mailto:${contactEmail}`} className="underline">{contactEmail}</a>.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">8. Third-Party Services</h2>
            <p>
              We use the following third-party services that may process your data under their own privacy policies:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Meta (WhatsApp Cloud API) — for WhatsApp message delivery</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">9. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. Changes will be posted at this URL with an updated date.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">10. Contact</h2>
            <p>
              For any privacy-related questions, contact us at{" "}
              <a href={`mailto:${contactEmail}`} className="underline">{contactEmail}</a>.
            </p>
          </div>

        </section>
      </div>
    </main>
  );
}
