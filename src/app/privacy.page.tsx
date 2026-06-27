export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground">
      <article className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
        <a href="/login?mode=register" className="text-sm font-semibold text-primary underline">← Back to sign up</a>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm opacity-60">Last updated: 28 June 2026</p>

        <section className="mt-8 space-y-4 text-sm leading-7 opacity-80">
          <p>
            This Privacy Policy explains how ClasicCloset collects, uses, stores, and protects information when you use
            our website, create an account, place an order, or contact support.
          </p>

          <h2 className="pt-4 text-xl font-bold opacity-100">1. Information we collect</h2>
          <p>
            We may collect your name, email address, phone number, delivery address, account details, order history,
            payment confirmation details, device/session information, and messages you send to support.
          </p>

          <h2 className="pt-4 text-xl font-bold opacity-100">2. How we use your information</h2>
          <p>
            We use your information to create and secure your account, verify your contact details, process orders,
            confirm payments, deliver purchases, provide receipts, prevent fraud, and respond to customer support requests.
          </p>

          <h2 className="pt-4 text-xl font-bold opacity-100">3. Payments</h2>
          <p>
            Payment processing may be handled by third-party payment providers. We store payment status and reference
            information needed to confirm your order, but we do not ask you to share card passwords or banking PINs.
          </p>

          <h2 className="pt-4 text-xl font-bold opacity-100">4. Cookies and sessions</h2>
          <p>
            We use cookies or similar session technology to keep you signed in, protect your account, manage your cart,
            and improve the checkout experience.
          </p>

          <h2 className="pt-4 text-xl font-bold opacity-100">5. Data protection</h2>
          <p>
            We apply reasonable security measures to protect your data. No online system is completely risk-free, so you
            should also keep your password confidential and use a strong, unique password.
          </p>

          <h2 className="pt-4 text-xl font-bold opacity-100">6. Contact</h2>
          <p>
            For privacy, account, or order questions, contact ClasicCloset support at support@cctamcc.site.
          </p>
        </section>
      </article>
    </main>
  );
}
