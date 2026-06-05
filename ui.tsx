'use client';
import { api } from '@/lib/api'; import { useMutation, useQueryClient } from '@tanstack/react-query';
export function AddToCart({productId}:{productId:string}){ const qc=useQueryClient(); const m=useMutation({mutationFn:()=>api.addCart(productId,1),onSuccess:()=>qc.invalidateQueries({queryKey:['cart']})}); return <button disabled={m.isPending} onClick={()=>m.mutate()} className="rounded-full bg-primary px-8 py-3 font-bold text-primaryForeground">{m.isPending?'Adding...':'Add to bag'}</button> }
