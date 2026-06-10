export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14 space-y-14">

      {/* Hero */}
      <section className="space-y-4">
        <p className="text-xs font-semibold tracking-widest uppercase opacity-40">
          Our story
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
          Dressing Kenya,<br />one wardrobe at a time.
        </h1>
        <p className="text-base opacity-70 leading-relaxed max-w-lg">
          ClasicCloset was born from a simple frustration: quality, stylish clothing
          that fits the Kenyan body and budget was too hard to find in one place.
          We fixed that.
        </p>
      </section>

      <hr className="border-border" />

      {/* Values */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold">What we stand for</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: '✦',
              title: 'Quality first',
              body: 'Every piece is chosen for how it feels, fits, and lasts — not just how it photographs.',
            },
            {
              icon: '◈',
              title: 'Honest pricing',
              body: 'Fair prices, no hidden fees, free shipping on every order. What you see is what you pay.',
            },
            {
              icon: '◉',
              title: 'Built for Kenya',
              body: 'Pay with M-Pesa or card. Shop in KES. Delivered to your door across the country.',
            },
          ].map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-card p-5 space-y-2">
              <span className="text-2xl">{v.icon}</span>
              <p className="font-semibold">{v.title}</p>
              <p className="text-sm opacity-60 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-border" />

      {/* Contact */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Get in touch</h2>
        <p className="text-sm opacity-60 max-w-md">
          Questions about an order, a product, or anything else? We're here.
        </p>
        <div className="space-y-2 text-sm">
          {[
            { label: 'Email', value: 'hello@cctamcc.site', href: 'mailto:hello@cctamcc.site' },
            { label: 'WhatsApp', value: '+254 700 000 000', href: 'https://wa.me/254700000000' },
            { label: 'Instagram', value: '@clasiccloset', href: 'https://instagram.com/clasiccloset' },
          ].map((c) => (
            <div key={c.label} className="flex items-center gap-3">
              <span className="w-20 opacity-40 shrink-0">{c.label}</span>
              <a href={c.href}
                className="font-medium hover:text-primary transition-colors underline underline-offset-2">
                {c.value}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <a href="/shop"
          className="rounded-full bg-primary px-6 py-3 text-center font-bold text-primaryForeground hover:opacity-90 transition-opacity">
          Shop the collection
        </a>
        <a href="/categories"
          className="rounded-full border border-border px-6 py-3 text-center font-medium hover:bg-muted transition-colors">
          Browse categories
        </a>
      </div>

    </main>
  );
}
