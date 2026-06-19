'use client';

import { Suspense, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { adminApi } from '@/lib/admin-api';
import { ApiRequestError } from '@/lib/api';

function money(n: number) {
  return `KES ${Number(n).toLocaleString('en-KE')}`;
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

  function autoSlug(name: string) {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        price: Number(form.price),
        image: form.image,
        category: form.category,
        stock: Number(form.stock),
        sizes: form.sizes.split(',').map((s: string) => s.trim()).filter(Boolean),
        colors: form.colors.split(',').map((s: string) => s.trim()).filter(Boolean),
        featured: form.featured,
        isActive: form.isActive,
      };
      return isEdit
        ? adminApi.updateProduct(product.id, body)
        : adminApi.createProduct(body);
    },
    onSuccess: onSaved,
    onError: (err) => setError(err instanceof ApiRequestError ? err.message : 'Save failed'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-border bg-background p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">{isEdit ? 'Edit product' : 'New product'}</h2>
          <button onClick={onCancel} className="opacity-40 hover:opacity-70 text-xl leading-none">✕</button>
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
          <input
            placeholder="slug-like-this"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            className="w-full rounded-xl border border-border bg-muted p-2.5 text-sm font-mono"
          />
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
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="rounded-xl border border-border bg-muted p-2.5 text-sm"
            />
            <input
              placeholder="Stock"
              type="number"
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              className="rounded-xl border border-border bg-muted p-2.5 text-sm"
            />
          </div>
          <input
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full rounded-xl border border-border bg-muted p-2.5 text-sm"
          />
          <input
            placeholder="Sizes (comma separated, e.g. S, M, L, XL)"
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
          <div className="flex gap-4 text-sm">
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || !form.name || !form.slug || !form.price}
          className="w-full rounded-full bg-primary py-3 font-bold text-primaryForeground disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AdminProductsContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<any | null | undefined>(undefined); // undefined = closed
  const [deleteConfirm, setDeleteConfirm] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, page],
    queryFn: () => adminApi.products({ search, page }),
  });

  const products: any[] = data?.data?.products ?? [];
  const totalPages: number = data?.data?.totalPages ?? 1;

  // Deep-link support: /admin/products?edit=<id> opens the edit form directly
  // (used by the low-stock list on the dashboard overview)
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && products.length > 0) {
      const p = products.find((p) => p.id === editId);
      if (p) setEditing(p);
    }
  }, [searchParams, products]);

  const deactivate = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDeleteConfirm(null);
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={() => setEditing(null)}
          className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primaryForeground"
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
          onCancel={() => setEditing(undefined)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            setEditing(undefined);
          }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-background p-6 space-y-4">
            <p className="font-semibold">Remove "{deleteConfirm.name}"?</p>
            <p className="text-sm opacity-60">
              This deactivates the product — it'll disappear from the shop but stay in past order history.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-full border border-border py-2.5 text-sm font-medium">Cancel</button>
              <button
                onClick={() => deactivate.mutate(deleteConfirm.id)}
                disabled={deactivate.isPending}
                className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {deactivate.isPending ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
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
