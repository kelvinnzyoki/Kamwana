'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi } from '@/lib/admin-api';
import { ApiRequestError } from '@/lib/api';

function money(n: number) {
  return `KES ${Number(n).toLocaleString('en-KE')}`;
}

// ─── Body scroll lock ───────────────────────────────────────────────────────────
// Without this, the page behind an open modal still scrolls on touch devices —
// a common cause of modals "feeling broken" on phones (background content
// drifts while the modal stays fixed, and iOS Safari can rubber-band oddly).

function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [active]);
}

// ─── Field-level error extraction ────────────────────────────────────────────────
// The backend's validate.ts middleware returns { message: 'Validation failed',
// errors: [{ path, message }, ...] } on a 400 — one entry per Zod issue, with
// the exact nested field path (e.g. "body.image"), not grouped/flattened.
// This was previously read from ZodError.flatten()'s fieldErrors, which only
// inspects the schema's first level — since every route schema is wrapped as
// z.object({ body: z.object({...}) }), flatten() attributed every error to
// the top-level key "body" itself (e.g. "body: Invalid url") rather than the
// actual failing field ("image: Invalid url"). The path is stripped of its
// leading "body."/"query."/"params." prefix here so the field name shown
// matches what's actually on the form.

function getFieldErrors(err: unknown): string[] {
  if (!(err instanceof ApiRequestError)) return [];
  const issues = (err.data as any)?.errors;
  if (!Array.isArray(issues)) return [];
  return issues.map((issue: { path?: string; message?: string }) => {
    const field = (issue.path ?? '').replace(/^(body|query|params)\.?/, '') || 'value';
    return `${field}: ${issue.message ?? 'Invalid value'}`;
  });
}

function getSaveError(err: unknown): string {
  if (err instanceof ApiRequestError) return err.message || 'Save failed';
  return 'Save failed';
}

// ─── Product form (create + edit) ──────────────────────────────────────────────

function ProductForm({
  product,
  onSaved,
  onCancel,
}: {
  product: any | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  useScrollLock(true);

  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    description: product?.description ?? '',
    price: product?.price ?? '',
    image: product?.image ?? '',
    category: product?.category ?? '',
    stock: product?.stock ?? '',
    sizes: (product?.sizes ?? []).join(', '),
    colors: (product?.colors ?? []).join(', '),
    featured: product?.featured ?? false,
    isActive: product?.isActive ?? true,
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  function autoSlug(name: string) {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  const save = useMutation({
    mutationFn: () => {
      // FIX: build the payload defensively rather than always sending every
      // field verbatim. The previous version always sent image/category as
      // whatever string was currently in the form — if either happened to be
      // blank (e.g. a product edited before those fields existed, or cleared
      // accidentally), the backend's z.string().url() / z.string().min(1)
      // checks reject an empty string outright, which is the most likely
      // cause of the "Validation failed" 400. Only including fields that
      // actually have a real value prevents this entire class of failure —
      // an omitted field simply isn't changed, rather than being sent as an
      // invalid empty string.
      //
      // `slug` is also no longer sent on edit: the update endpoint doesn't
      // accept it at all (slugs are immutable after creation, since shop
      // links and SEO depend on them), so there's no reason to include it.
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        sizes: form.sizes.split(',').map((s: string) => s.trim()).filter(Boolean),
        colors: form.colors.split(',').map((s: string) => s.trim()).filter(Boolean),
        featured: form.featured,
        isActive: form.isActive,
      };

      const price = Number(form.price);
      if (form.price !== '' && !Number.isNaN(price)) body.price = price;

      const stock = Number(form.stock);
      if (form.stock !== '' && !Number.isNaN(stock)) body.stock = stock;

      if (form.image.trim()) body.image = form.image.trim();

      if (!isEdit) body.slug = form.slug.trim();

      return isEdit
        ? adminApi.updateProduct(product.id, body)
        : adminApi.createProduct(body);
    },
    onSuccess: onSaved,
    onError: (err) => {
      setError(getSaveError(err));
      setFieldErrors(getFieldErrors(err));
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[85dvh] sm:max-h-[88vh] overflow-y-auto overscroll-contain rounded-t-3xl sm:rounded-3xl border border-border bg-background p-4 sm:p-6 space-y-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-6"
      >
        <div className="sticky -top-4 sm:-top-6 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-2 flex items-center justify-between bg-background px-4 sm:px-6 py-3 border-b border-border z-10">
          <h2 className="font-bold text-base sm:text-lg">{isEdit ? 'Edit product' : 'New product'}</h2>
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-full opacity-50 hover:opacity-100 hover:bg-muted text-lg leading-none transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <input
            placeholder="Product name"
            value={form.name}
            onChange={(e) => setForm((f) => ({
              ...f, name: e.target.value,
              slug: isEdit ? f.slug : autoSlug(e.target.value),
            }))}
            className="w-full rounded-xl border border-border bg-muted p-2.5 text-sm"
          />

          {!isEdit && (
            <input
              placeholder="slug-like-this"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="w-full rounded-xl border border-border bg-muted p-2.5 text-sm font-mono"
            />
          )}
          {isEdit && (
            <p className="text-xs opacity-40 px-0.5">
              URL: /product/{form.slug} <span className="opacity-70">(slug can't be changed after creation)</span>
            </p>
          )}

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full rounded-xl border border-border bg-muted p-2.5 text-sm resize-none"
          />
          <input
            placeholder="Image URL"
            value={form.image}
            onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
            className="w-full rounded-xl border border-border bg-muted p-2.5 text-sm"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Price (KES)"
              type="number"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="min-w-0 w-full rounded-xl border border-border bg-muted p-2.5 text-sm"
            />
            <input
              placeholder="Stock"
              type="number"
              inputMode="numeric"
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              className="min-w-0 w-full rounded-xl border border-border bg-muted p-2.5 text-sm"
            />
          </div>

          <input
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full rounded-xl border border-border bg-muted p-2.5 text-sm"
          />
          <input
            placeholder="Sizes (comma separated — e.g. S, M, L, XL or 39, 40, 41)"
            value={form.sizes}
            onChange={(e) => setForm((f) => ({ ...f, sizes: e.target.value }))}
            className="w-full rounded-xl border border-border bg-muted p-2.5 text-sm"
          />
          <input
            placeholder="Colors (comma separated)"
            value={form.colors}
            onChange={(e) => setForm((f) => ({ ...f, colors: e.target.value }))}
            className="w-full rounded-xl border border-border bg-muted p-2.5 text-sm"
          />

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.featured}
                onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
              Featured
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
              Active (visible in shop)
            </label>
          </div>
        </div>

        {/* Top-level error + exact field-level reasons, if the backend sent them */}
        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 p-3 space-y-1">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
            {fieldErrors.length > 0 && (
              <ul className="text-xs text-red-600 dark:text-red-400 space-y-0.5 list-disc list-inside">
                {fieldErrors.map((msg) => <li key={msg}>{msg}</li>)}
              </ul>
            )}
          </div>
        )}

        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || !form.name || (!isEdit && !form.slug) || !form.price}
          className="w-full rounded-full bg-primary py-3 font-bold text-primaryForeground disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
        </button>
      </div>
    </div>
  );
}

// ─── Delete confirmation modal ────────────────────────────────────────────────

function DeleteConfirmModal({
  product,
  onCancel,
  onConfirm,
  isPending,
}: {
  product: any;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  useScrollLock(true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl border border-border bg-background p-5 sm:p-6 space-y-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-6"
      >
        <p className="font-semibold">Remove "{product.name}"?</p>
        <p className="text-sm opacity-60">
          This deactivates the product — it'll disappear from the shop but stay in past order history.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-border py-2.5 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {isPending ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AdminProductsContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<any | null | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<any | null>(null);

  // FIX: when the edit form is opened via a ?edit=<id> deep-link (e.g. from
  // the low-stock list on the dashboard), closing it must also remove that
  // query param. Without this, ?edit=<id> stays in the URL after save/cancel,
  // and the useEffect below re-opens the form immediately on the next render —
  // trapping the user in an endless edit loop with no way to browse products.
  const closeEdit = useCallback(() => {
    setEditing(undefined);
    if (searchParams.get('edit')) {
      router.replace('/admin/products');
    }
  }, [router, searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, page],
    queryFn: () => adminApi.products({ search, page }),
  });

  const products: any[] = data?.data?.products ?? [];
  const totalPages: number = data?.data?.totalPages ?? 1;

  // Deep-link support: /admin/products?edit=<id> opens the edit form directly,
  // fetched directly by ID (independent of pagination — see admin.routes.ts).
  const editId = searchParams.get('edit');
  const { data: editProductData } = useQuery({
    queryKey: ['admin-product', editId],
    queryFn: () => adminApi.product(editId as string),
    enabled: !!editId,
  });

  useEffect(() => {
    if (editProductData?.data?.product) {
      setEditing(editProductData.data.product);
    }
  }, [editProductData]);

  const deactivate = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDeleteConfirm(null);
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={() => setEditing(null)}
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primaryForeground"
        >
          + New product
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search products…"
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-2xl bg-border animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-border p-12 text-center opacity-50">No products found</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {products.map((p) => (
            <div key={p.id} className={`flex items-center gap-3 rounded-2xl border bg-card p-3 ${
              !p.isActive ? 'opacity-50 border-dashed' : 'border-border'
            }`}>
              {p.image && (
                <img src={p.image} alt={p.name} className="h-14 w-14 rounded-xl object-cover bg-muted shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{p.name}</p>
                <p className="text-xs opacity-50">{money(p.price)} · {p.stock} in stock</p>
                {!p.isActive && <p className="text-[10px] text-amber-600">Inactive</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => setEditing(p)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium border border-border hover:bg-muted"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(p)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-full border border-border px-4 py-1.5 text-sm disabled:opacity-30">Previous</button>
          <span className="text-sm opacity-50">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="rounded-full border border-border px-4 py-1.5 text-sm disabled:opacity-30">Next</button>
        </div>
      )}

      {editing !== undefined && (
        <ProductForm
          product={editing}
          onCancel={closeEdit}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            closeEdit();
          }}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          product={deleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => deactivate.mutate(deleteConfirm.id)}
          isPending={deactivate.isPending}
        />
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-border animate-pulse" />
          ))}
        </div>
      }
    >
      <AdminProductsContent />
    </Suspense>
  );
}
