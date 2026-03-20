"use client";

import { useState } from "react";
import Image from "next/image";

/* ───────── scent options for the bundle selector ───────── */
const SCENTS = [
  "Turkish Rose & Sandalwood",
  "Lemongrass & Rosemary",
  "White Neroli & Lemon",
  "Vanilla & Sandalwood",
  "Chamomile & Vetiver",
  "Water Lily & White Musk",
  "Orange & Chamomile",
  "Jasmine & Rosewood",
  "Bergamot & Lemon",
  "Lime & Grapefruit",
  "Lavender & Peppermint",
  "Wild Berries & Fig",
];

/* ───────── review data ───────── */
const REVIEWS = [
  { text: "Arrived quickly and well packaged, smells amazing.", author: "Linda Fine" },
  { text: "Very pleased — give it as presents. I always choose the Lemongrass and Rosemary, it is my favourite!", author: "Anne Thomas" },
  { text: "Everything I have bought is absolutely amazing, the smell is gorgeous and I always get remarks from anyone coming into my home.", author: "xxalison1971xx" },
  { text: "These reed diffusers smell lovely, everyone comments on how fresh they smell. Originally received as a gift, then decided to order more!", author: "Aimee Sewell" },
  { text: "I absolutely love these products. I've bought many diffusers from here and love all of them.", author: "Joan Suggett" },
  { text: "Absolutely fabulous smell — cannot praise it enough, will be ordering more.", author: "Dorothy Kirby" },
];

/* ───────── FAQ data ───────── */
const FAQS = [
  { q: "Are the diffusers completely natural?", a: "Yes. We use 100% natural essential oils and never artificial fragrance oils or synthetic fillers." },
  { q: "How long do the diffusers last?", a: "Our full-size diffusers are designed to fragrance your home for up to 12 weeks, depending on room conditions." },
  { q: "Is the fragrance strong but not overpowering?", a: "Yes. Our blends are carefully balanced to be noticeable, room-filling, and refined — never harsh." },
  { q: "Why does the diffuser oil colour vary?", a: "Natural essential oils vary by harvest, so colour differences are normal and expected." },
  { q: "Do the candles scent a room well?", a: "Yes. Our candles are poured with a high concentration of essential oils for excellent scent throw." },
  { q: "What wax are the candles made from?", a: "We use natural soy wax for a cleaner burn and better fragrance diffusion." },
  { q: "Are the fragrances suitable for gifting?", a: "Yes. Our fragrances are designed to be universally appealing, elegant, and easy to enjoy — making them ideal gifts." },
  { q: "Why choose us over cheaper brands?", a: "We focus on pure ingredients, long-lasting performance, and quality control — not shortcuts. That's why our fragrances last longer and smell more authentic." },
];

/* ───────── comparison features ───────── */
const COMPARISON = [
  { feature: "8x stronger fragrance", us: true, them: false },
  { feature: "Lasts up to 12 weeks", us: true, them: false },
  { feature: "100% pure essential oils", us: true, them: false },
  { feature: "Organic ingredients", us: true, them: false },
  { feature: "Cruelty-free & vegan", us: true, them: false },
  { feature: "Hand-made in the UK", us: true, them: false },
];

/* ───────── what makes special ───────── */
const SPECIAL_FEATURES = [
  { icon: "🔥", title: "8x Stronger Scent", desc: "Our diffusers use a higher concentration of essential oils than supermarket brands, delivering a noticeably richer fragrance." },
  { icon: "⏱️", title: "Lasts Up to 12 Weeks", desc: "Designed for longevity — enjoy continuous fragrance without constant refilling." },
  { icon: "🌱", title: "100% Pure Essential Oils", desc: "No synthetic fillers or artificial fragrances. Just pure, natural scent." },
  { icon: "🏡", title: "Hand-made in the UK", desc: "Backed by 15 years of research and development in the UK." },
];

/* ───────── gallery images ───────── */
const GALLERY = [
  { img: "Ready-Set-Scent-Landing-Page-Images_2.webp", handle: "@daydreaming.and_.diy_" },
  { img: "Ready-Set-Scent-Landing-Page-Images_3.webp", handle: "@housetohome_59" },
  { img: "Ready-Set-Scent-Landing-Page-Images_4.webp", handle: "@countryhomeni" },
  { img: "Ready-Set-Scent-Landing-Page-Images_5-1.webp", handle: "@herbieinthewillows_" },
  { img: "Ready-Set-Scent-Landing-Page-Images_6.webp", handle: "@no32_ourforeverhome" },
  { img: "Ready-Set-Scent-Landing-Page-Images_7.webp", handle: "@at_home_with_bekki" },
  { img: "Ready-Set-Scent-Landing-Page-Images_8.webp", handle: "@ivorynovahome" },
  { img: "Ready-Set-Scent-Landing-Page-Images_9.webp", handle: "@houseonthemeadow" },
];

export default function LandingPage() {
  const [scent1, setScent1] = useState("");
  const [scent2, setScent2] = useState("");
  const [scent3, setScent3] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-white text-[#222] font-sans" style={{ colorScheme: "light" }}>
      {/* ═══════════ TOP BAR ═══════════ */}
      <div className="bg-[#f8f5f0] text-center py-3 px-4 text-[11px] sm:text-xs tracking-wider uppercase font-medium text-[#555]">
        <span className="hidden sm:inline">A diffuser is sold every <span className="font-bold text-[#222]">18 seconds!</span><span className="mx-3 opacity-30">|</span></span>
        <span>4.9 stars, <span className="font-bold text-[#222]">350k reviews</span></span>
        <span className="mx-3 opacity-30">|</span>
        <span><span className="font-bold text-[#222]">1 million</span> customers</span>
      </div>

      {/* ═══════════ HEADER ═══════════ */}
      <header className="bg-white border-b border-[#f0ece6] px-5 sm:px-10 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="text-2xl font-black tracking-tight text-[#222]">
            Valentte
          </a>
          <a
            href="#bundle"
            className="bg-[#222] text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#333] transition-colors"
          >
            Shop Now
          </a>
        </div>
      </header>

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative bg-[#faf8f5] overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-10 py-14 sm:py-24 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          <div className="flex-1 text-center lg:text-left space-y-6 max-w-xl">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#b5956e]">Limited-time offer</p>
            <h1 className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] font-black tracking-tight leading-[1.08]">
              Natural scents for your whole home
            </h1>
            <p className="text-base sm:text-lg text-[#555] leading-relaxed">
              3 reed diffusers for only <span className="font-bold text-[#222]">£39.99</span>{" "}
              <span className="line-through text-[#999]">£84.86</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 lg:justify-start justify-center">
              <a href="#bundle" className="bg-[#222] text-white px-8 py-4 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-[#333] active:scale-[0.97] transition-all shadow-lg">
                Get Your Offer
              </a>
              <p className="text-xs text-[#999] uppercase tracking-wider font-medium">Save £44.97!</p>
            </div>
          </div>
          <div className="flex-1 max-w-lg w-full">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-[#ede8e0] shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://valentte.com/wp-content/uploads/2026/02/Ready-Set-Scent-Landing-Page-Images_1.webp"
                alt="Reed diffuser collection"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SOCIAL PROOF BAR ═══════════ */}
      <section className="bg-white border-y border-[#eee] py-6 px-5">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 sm:gap-12 text-center">
          {[
            { stat: "1M+", label: "Happy customers" },
            { stat: "4.9★", label: "350k reviews" },
            { stat: "18s", label: "One sold every" },
            { stat: "12wk", label: "Lasts up to" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center">
              <p className="text-2xl sm:text-3xl font-black text-[#222]">{item.stat}</p>
              <p className="text-[11px] sm:text-xs text-[#888] uppercase tracking-wider font-medium mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ PROMISE SECTION ═══════════ */}
      <section className="bg-white py-16 sm:py-24 px-5">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#b5956e]">Why Choose Us</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Our promise to you</h2>
            <p className="text-base sm:text-lg text-[#666] max-w-2xl mx-auto leading-relaxed">
              Our diffusers are stronger, last longer, and are more affordable. That&apos;s our promise.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: "💪", title: "8x Stronger", desc: "Than supermarket brands" },
              { icon: "🕐", title: "12 Weeks", desc: "Long-lasting fragrance" },
              { icon: "🌿", title: "100% Natural", desc: "Pure essential oils" },
              { icon: "🇬🇧", title: "Made in UK", desc: "Hand-crafted with care" },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center gap-3 p-5 sm:p-6 rounded-2xl bg-[#faf8f5]">
                <span className="text-3xl sm:text-4xl">{item.icon}</span>
                <h3 className="text-sm sm:text-base font-bold text-[#222]">{item.title}</h3>
                <p className="text-xs text-[#888] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BUNDLE SELECTOR ═══════════ */}
      <section id="bundle" className="bg-[#faf8f5] py-16 sm:py-24 px-5 scroll-mt-20">
        <div className="max-w-xl mx-auto">
          <div className="text-center space-y-4 mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#b5956e]">Build Your Set</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Create your bundle</h2>
            <p className="text-base text-[#666]">Choose your favourite fragrances, or let us recommend our best-sellers!</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-10 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs text-[#888] uppercase tracking-wider font-medium">3 Reed Diffusers</p>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-[#222]">£39.99</span>
                  <span className="text-base line-through text-[#bbb]">£84.86</span>
                  <span className="bg-[#222] text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">Save 53%</span>
                </div>
              </div>
              <p className="text-xs text-[#999] font-medium">Under £17 per diffuser</p>
            </div>

            <hr className="border-[#eee]" />

            {[
              { label: "1. Choose your first diffuser", value: scent1, setter: setScent1 },
              { label: "2. Choose your second diffuser", value: scent2, setter: setScent2 },
              { label: "3. Choose your third diffuser", value: scent3, setter: setScent3 },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <label className="text-xs sm:text-sm font-bold text-[#222]">{item.label}</label>
                <select
                  value={item.value}
                  onChange={(e) => item.setter(e.target.value)}
                  className="w-full border border-[#ddd] rounded-xl px-4 py-3.5 text-sm text-[#444] bg-[#fafafa] focus:outline-none focus:border-[#aaa] transition-colors"
                >
                  <option value="">Select a fragrance...</option>
                  {SCENTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            ))}

            <button className="w-full bg-[#222] text-white py-4 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-[#333] active:scale-[0.98] transition-all shadow-lg mt-2">
              Get Your Offer — £39.99
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════ COMPARISON TABLE ═══════════ */}
      <section className="bg-white py-16 sm:py-24 px-5">
        <div className="max-w-2xl mx-auto text-center space-y-10">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#b5956e]">The Difference</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Better than the rest</h2>
          </div>

          <div className="rounded-2xl overflow-hidden border border-[#eee]">
            <div className="grid grid-cols-3 bg-[#faf8f5]">
              <div className="p-4 text-left text-xs font-bold uppercase tracking-wider text-[#888]">Feature</div>
              <div className="p-4 text-center text-xs font-bold uppercase tracking-wider text-[#222]">Us</div>
              <div className="p-4 text-center text-xs font-bold uppercase tracking-wider text-[#888]">Others</div>
            </div>
            {COMPARISON.map((row, i) => (
              <div key={row.feature} className={`grid grid-cols-3 ${i % 2 === 0 ? "bg-white" : "bg-[#fdfcfa]"} border-t border-[#eee]`}>
                <div className="p-4 text-left text-xs sm:text-sm text-[#444]">{row.feature}</div>
                <div className="p-4 text-center text-base sm:text-lg">✅</div>
                <div className="p-4 text-center text-base sm:text-lg">❌</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ WHAT MAKES SPECIAL ═══════════ */}
      <section className="bg-[#faf8f5] py-16 sm:py-24 px-5">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#b5956e]">Crafted With Care</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">What makes our diffusers special?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {SPECIAL_FEATURES.map((feat) => (
              <div key={feat.title} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm flex gap-5">
                <div className="w-12 h-12 rounded-xl bg-[#faf8f5] flex items-center justify-center text-2xl shrink-0">
                  {feat.icon}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#222] mb-1">{feat.title}</h3>
                  <p className="text-sm text-[#666] leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ IMAGE GALLERY ═══════════ */}
      <section className="bg-white py-16 sm:py-24 px-5">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#b5956e]">Gallery</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">In their own words</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {GALLERY.map((item) => (
              <div key={item.handle} className="group relative aspect-square rounded-2xl overflow-hidden bg-[#f0ece6]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://valentte.com/wp-content/uploads/2026/02/${item.img}`}
                  alt={item.handle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end justify-center pb-4">
                  <p className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.handle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ REVIEWS ═══════════ */}
      <section className="bg-[#faf8f5] py-16 sm:py-24 px-5">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#b5956e]">1 Million Happy Customers</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Don&apos;t just take our word for it</h2>
            <p className="text-base text-[#666]">Here&apos;s why our customers love our fragrances!</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {REVIEWS.map((review, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <span key={j} className="text-[#ffa200] text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm text-[#444] leading-relaxed italic">&ldquo;{review.text}&rdquo;</p>
                <p className="text-xs font-bold text-[#222] uppercase tracking-wider">{review.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FOUNDERS ═══════════ */}
      <section className="bg-white py-16 sm:py-24 px-5">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          <div className="flex-1 max-w-md w-full">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-[#ede8e0]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://valentte.com/wp-content/uploads/2026/02/jl-1.webp"
                alt="Justina and Luke, founders"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-[#b5956e]">Our Story</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Meet Justina &amp; Luke, our founders</h2>
            <p className="text-base text-[#555] leading-relaxed">
              What started as a passion for natural fragrances has grown into a mission: to bring beautifully crafted,
              100% pure essential oil products to every home. Every scent is developed, tested, and hand-made in the UK
              with care and attention to detail.
            </p>
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              {["Vegan & Cruelty-free", "Organic Ingredients", "Made in the UK"].map((tag) => (
                <span key={tag} className="text-xs font-bold uppercase tracking-wider text-[#666] bg-[#faf8f5] px-4 py-2 rounded-full">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="bg-[#faf8f5] py-16 sm:py-24 px-5">
        <div className="max-w-2xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#b5956e]">Support</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Got a question?</h2>
            <p className="text-base text-[#666]">Here are the answers to some of our most commonly asked questions.</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left"
                >
                  <span className="text-sm sm:text-base font-bold text-[#222] pr-4">{faq.q}</span>
                  <span
                    className="text-xl text-[#888] shrink-0 transition-transform duration-200"
                    style={{ transform: openFaq === i ? "rotate(45deg)" : "none" }}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 -mt-2">
                    <p className="text-sm text-[#666] leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BOTTOM CTA ═══════════ */}
      <section className="bg-[#222] text-white py-16 sm:py-20 px-5">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#b5956e]">Limited-time offer</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Save 53%</h2>
          <p className="text-base text-white/60 leading-relaxed">
            3 reed diffusers for only <span className="text-white font-bold">£39.99</span>{" "}
            <span className="line-through text-white/40">£84.86</span>
          </p>
          <a
            href="#bundle"
            className="inline-block bg-white text-[#222] px-8 py-4 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-white/90 active:scale-[0.97] transition-all shadow-lg"
          >
            Get Offer
          </a>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-[#55555e] text-white py-8 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-sm font-bold">Valentte</p>
          <p className="text-xs text-white/50">&copy; {new Date().getFullYear()} Valentte. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
