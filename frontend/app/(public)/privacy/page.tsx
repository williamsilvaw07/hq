import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy – NorthTrack" };

export default function PrivacyPage() {
  const lastUpdated = "March 15, 2026";
  const appName = "NorthTrack";
  const contactEmail = "privacy@williamhq.com";
  const appUrl = "https://williamhq.com";

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mb-4">Legal</p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground/50 mb-12">Last updated: {lastUpdated}</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground/70">
          <section>
            <h2 className="text-base font-bold text-foreground mb-2">1. Overview</h2>
            <p>
              {appName} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is a personal finance tracking application
              available at <a href={appUrl} className="text-foreground underline underline-offset-2">{appUrl}</a>. This Privacy Policy explains what data
              we collect, how we use it, and your rights regarding that data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">2. Data We Collect</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li><strong className="text-foreground">Account information:</strong> name, email address, and password (stored hashed).</li>
              <li><strong className="text-foreground">Financial data:</strong> transactions, budgets, categories, and accounts you create within the app.</li>
              <li><strong className="text-foreground">Telegram chat ID:</strong> if you choose to link your Telegram account for expense logging via our bot.</li>
              <li><strong className="text-foreground">Message content:</strong> text, voice, and photo messages sent to our Telegram bot are processed to extract expense data. Message IDs are stored for deduplication only.</li>
              <li><strong className="text-foreground">Avatar images:</strong> profile photos you upload.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">3. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>To provide and operate the {appName} service.</li>
              <li>To process expense and income entries submitted via the Telegram bot.</li>
              <li>To send confirmation replies via Telegram when a transaction is recorded.</li>
              <li>To use AI services (Groq) for voice transcription, receipt reading, and category suggestions.</li>
              <li>We do not sell, share, or rent your data to third parties.</li>
              <li>We do not use your data for advertising or marketing purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">4. Telegram Integration</h2>
            <p>
              {appName} uses the Telegram Bot API to allow users to log expenses by sending text messages, voice notes, or photos.
              When you send a message to our bot, the content is received via Telegram&apos;s platform and
              processed solely to create a transaction entry in your workspace. Message IDs are stored to prevent
              duplicate processing. Voice messages are transcribed using Groq Whisper, and photos are analyzed using Groq Vision.
              We do not store raw audio or image files after processing.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">5. Data Storage and Security</h2>
            <p>
              Your data is stored in a secured MySQL database. Passwords are hashed using bcrypt and never stored in plain text.
              Authentication uses JWT tokens. Access tokens and secrets are stored as environment variables and are never exposed to the client.
              All workspace data is isolated — members of one workspace cannot access another workspace&apos;s data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">6. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. You may request deletion of your account
              and all associated data at any time by contacting us at{" "}
              <a href={`mailto:${contactEmail}`} className="text-foreground underline underline-offset-2">{contactEmail}</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">7. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data. To exercise these rights,
              contact us at <a href={`mailto:${contactEmail}`} className="text-foreground underline underline-offset-2">{contactEmail}</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">8. Third-Party Services</h2>
            <p className="mb-2">
              We use the following third-party services that may process your data under their own privacy policies:
            </p>
            <ul className="list-disc list-inside space-y-1.5">
              <li><strong className="text-foreground">Telegram Bot API</strong> — for receiving and sending messages via the Telegram bot.</li>
              <li><strong className="text-foreground">Groq</strong> — for AI-powered voice transcription, image analysis, and expense categorization.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">9. Cookies</h2>
            <p>
              {appName} uses localStorage for authentication tokens and workspace preferences. We do not use tracking cookies
              or any third-party analytics services.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">10. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. Changes will be posted at this URL with an updated date.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">11. Contact</h2>
            <p>
              For any privacy-related questions, contact us at{" "}
              <a href={`mailto:${contactEmail}`} className="text-foreground underline underline-offset-2">{contactEmail}</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
