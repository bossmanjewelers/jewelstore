import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { apiGet, apiPost, apiPut } from '@/lib/api';
const schema = z.object({ name: z.string().min(1), description: z.string().optional(), categoryId: z.string().optional(), collection: z.string().optional(), metalType: z.enum(['GOLD','SILVER','PLATINUM','DIAMOND','CUSTOM']), purity: z.enum(['K18','K22','K24','OTHER']), weight: z.number({ coerce: true }).positive(), stoneType: z.string().optional(), stoneWeight: z.number({ coerce: true }).optional(), size: z.string().optional(), color: z.string().optional(), designNumber: z.string().optional(), brand: z.string().optional(), supplierId: z.string().optional(), purchasePrice: z.number({ coerce: true }).nonnegative(), makingCharges: z.number({ coerce: true }).nonnegative().default(0), otherCharges: z.number({ coerce: true }).nonnegative().default(0), sellingPrice: z.number({ coerce: true }).nonnegative(), quantity: z.number({ coerce: true }).int().nonnegative().default(1), minQuantity: z.number({ coerce: true }).int().nonnegative().default(1), notes: z.string().optional(), barcode: z.string().optional() });
type FormData = z.infer<typeof schema>;
const FIELD_GROUPS = [{ title: 'Basic Information', fields: [{ name: 'name', label: 'Item Name *', type: 'text', col: 2 },{ name: 'description', label: 'Description', type: 'textarea', col: 2 },{ name: 'metalType', label: 'Metal Type *', type: 'select', options: [['GOLD','Gold'],['SILVER','Silver'],['PLATINUM','Platinum'],['DIAMOND','Diamond'],['CUSTOM','Custom']] },{ name: 'purity', label: 'Purity *', type: 'select', options: [['K18','18K'],['K22','22K'],['K24','24K'],['OTHER','Other']] },{ name: 'collection', label: 'Collection', type: 'text' },{ name: 'brand', label: 'Brand', type: 'text' },{ name: 'designNumber', label: 'Design Number', type: 'text' },{ name: 'barcode', label: 'Barcode', type: 'text' }] },{ title: 'Physical Details', fields: [{ name: 'weight', label: 'Weight (g) *', type: 'number' },{ name: 'size', label: 'Size', type: 'text' },{ name: 'color', label: 'Color', type: 'text' },{ name: 'stoneType', label: 'Stone Type', type: 'text' },{ name: 'stoneWeight', label: 'Stone Weight', type: 'number' }] },{ title: 'Pricing & Stock', fields: [{ name: 'purchasePrice', label: 'Purchase Price *', type: 'number' },{ name: 'makingCharges', label: 'Making Charges', type: 'number' },{ name: 'otherCharges', label: 'Other Charges', type: 'number' },{ name: 'sellingPrice', label: 'Selling Price *', type: 'number' },{ name: 'quantity', label: 'Quantity *', type: 'number' },{ name: 'minQuantity', label: 'Min Qty', type: 'number' }] },{ title: 'Notes', fields: [{ name: 'notes', label: 'Notes', type: 'textarea', col: 2 }] }];
export default function InventoryForm() {
  const navigate = useNavigate(); const { id } = useParams(); const isEdit = Boolean(id); const qc = useQueryClient();
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => apiGet<any[]>('/categories') });
  const { data: existing } = useQuery({ queryKey: ['inventory', id], queryFn: () => apiGet<any>(`/inventory/${id}`), enabled: isEdit });
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { metalType: 'GOLD', purity: 'K22', quantity: 1, minQuantity: 1, makingCharges: 0, otherCharges: 0 } });
  useEffect(() => { if (existing) reset(existing); }, [existing, reset]);
  const mutation = useMutation({ mutationFn: (data: FormData) => isEdit ? apiPut(`/inventory/${id}`, data) : apiPost('/inventory', data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); navigate('/inventory'); } });
  const pp = watch('purchasePrice') || 0, mc = watch('makingCharges') || 0, oc = watch('otherCharges') || 0;
  const suggested = (Number(pp) + Number(mc) + Number(oc)) * 1.25;
  const cls = "w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500";
  return (<div className="max-w-4xl mx-auto space-y-5">
    <div className="flex items-center gap-3"><button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft size={18} /></button><h1 className="text-xl font-bold">{isEdit ? 'Edit Item' : 'Add Inventory Item'}</h1></div>
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      {FIELD_GROUPS.map((g) => (<div key={g.title} className="bg-white dark:bg-gray-800 rounded-xl border p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">{g.title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {g.fields.map((f: any) => (<div key={f.name} className={f.col===2?'sm:col-span-2':''}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{f.label}</label>
            {f.type==='textarea'?<textarea {...register(f.name)} rows={3} className={cls+' resize-none'} />
            :f.type==='select'?<select {...register(f.name)} className={cls}>
              {f.options?.map(([v,l]: any) => <option key={v} value={v}>{l}</option>)}
              {f.name==='categoryId'&&categories?.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            :<input {...register(f.name)} type={f.type} step={f.type==='number'?'0.001':undefined} className={cls} />}
            {(errors as any)[f.name]&&<p className="mt-1 text-xs text-red-500">{(errors as any)[f.name]?.message}</p>}
          </div>))}
        </div>
      </div>))}
      {suggested > 0 && <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">Suggested price (cost ×1.25): <strong>${suggested.toFixed(2)}</strong></div>}
      {mutation.isError&&<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{(mutation.error as any)?.response?.data?.message||'Failed to save'}</div>}
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={()=>navigate(-1)} className="px-4 py-2 border rounded-lg text-sm font-medium">Cancel</button>
        <button type="submit" disabled={isSubmitting||mutation.isPending} className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium disabled:opacity-60">
          {(isSubmitting||mutation.isPending)?<Loader2 size={16} className="animate-spin" />:<Save size={16} />} {isEdit?'Save Changes':'Add Item'}
        </button>
      </div>
    </form>
  </div>);
}
