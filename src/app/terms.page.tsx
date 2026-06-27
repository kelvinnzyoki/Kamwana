export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground">
      <article className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
        <a href="/login?mode=register" className="text-sm font-semibold text-primary underline">← Back to sign up</a>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm opacity-60">Last updated: 28 June 2026</p>

        <section className="mt-8 space-y-4 text-sm leading-7 opacity-80">
          <p>
            These Terms of Service govern your access to and use of ClasicCloset, including browsing products,
            creating an account, placing orders, making payments, and receiving delivery updates.
          </p>

          <h2 className="pt-4 text-xl font-bold opacity-100">1. Account responsibilities</h2>
          <p>
            You are responsible for providing accurate account, contact, delivery, and payment information. You must keep
            your login details secure and notify us if you believe your account has been accessed without permission.
          </p>

          <h2 className="pt-4 text-xl font-bold opacity-100">2. Orders and payments</h2>
          <p>
            Orders are processed based on product availability, successful payment confirmation, and valid delivery details.
            Prices, delivery fees, and product availability may change before an order is confirmed.
          </p>

          <h2 className="pt-4 text-xl font-bold opacity-100">3. Delivery</h2>
          <p>
            Delivery timelines are estimates unless expressly confirmed otherwise. You agree to provide a reachable phone
            number and accurate delivery address so we can complete your order efficiently.
          </p>

          <h2 className="pt-4 text-xl font-bold opacity-100">4. Returns and order issues</h2>
          <p>
            If you receive a wrong, damaged, or incomplete item, contact support as soon as possible with your order number,
            photos where applicable, and a clear description of the issue.
          </p>

          <h2 className="pt-4 text-xl font-bold opacity-100">5. Acceptable use</h2>
          <p>
            You must not misuse the platform, attempt unauthorized access, interfere with payments, submit false order
            details, or use the service for fraudulent activity.
          </p>

          <h2 className="pt-4 text-xl font-bold opacity-100">6. Contact</h2>
          <p>
            For order, account, payment, or delivery questions, contact ClasicCloset support at support@cctamcc.site.
          </p>
        </section>
      </article>
    </main>
  );
}
