import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { apiGet, apiPost, apiPut } from '@/lib/api';

const schema = z.object({
  name:          z.string().min(1, 'Name is required'),
  description:   z.string().optional(),
  categoryId:    z.string().optional(),
  collection:    z.string().optional(),
  metalType:     z.enum(['GOLD', 'SILVER', 'PLATINUM', 'DIAMOND', 'CUSTOM']),
  purity:        z.enum(['K18', 'K22', 'K24', 'OTHER']),
  weight:        z.number({ coerce: true }).positive('Weight must be positive'),
  stoneType:     z.string().optional(),
  stoneWeight:   z.number({ coerce: true }).optional(),
  size:          z.string().optional(),
  color:         z.string().optional(),
  designNumber:  z.string().optional(),
  brand:         z.string().optional(),
  supplierId:    z.string().optional(),
  purchasePrice: z.number({ coerce: true }).nonnegative(),
  makingCharges: z.number({ coerce: true }).nonnegative().default(0),
  otherCharges:  z.number({ coerce: true }).nonnegative().default(0),
  sellingPrice:  z.number({ coerce: true }).nonnegative(),
  quantity:      z.number({ coerce: true }).int().nonnegative().default(1),
  minQuantity:   z.number({ coerce: true }).int().nonnegative().default(1),
  notes:         z.string().optional(),
  barcode:       z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const inputClass = 'luxury-input text-sm';
const textareaClass = 'luxury-input text-sm resize-none';

const FIELD_GROUPS = [
  {
    title: 'Basic Information',
    fields: [
      { name: 'name',         label: 'Item Name *',    type: 'text',     col: 2 },
      { name: 'description',  label: 'Description',    type: 'textarea', col: 2 },
      { name: 'metalType',    label: 'Metal Type *',   type: 'select',   options: [['GOLD','Gold'],['SILVER','Silver'],['PLATINUM','Platinum'],['DIAMOND','Diamond'],['CUSTOM','Custom']] },
      { name: 'purity',       label: 'Purity *',       type: 'select',   options: [['K18','18K'],['K22','22K'],['K24','24K'],['OTHER','Other']] },
      { name: 'collection',   label: 'Collection',     type: 'text' },
      { name: 'brand',        label: 'Brand',          type: 'text' },
      { name: 'designNumber', label: 'Design Number',  type: 'text' },
      { name: 'barcode',      label: 'Barcode',        type: 'text' },
    ],
  },
  {
    title: 'Physical Details',
    fields: [
      { name: 'weight',      label: 'Weight (grams) *', type: 'number' },
      { name: 'size',        label: 'Size',             type: 'text' },
      { name: 'color',       label: 'Color',            type: 'text' },
      { name: 'stoneType',   label: 'Stone Type',       type: 'text' },
      { name: 'stoneWeight', label: 'Stone Weight (g)', type: 'number' },
    ],
  },
  {
    title: 'Pricing & Stock',
    fields: [
      { name: 'purchasePrice', label: 'Purchase Price *', type: 'number' },
      { name: 'makingCharges', label: 'Making Charges',   type: 'number' },
      { name: 'otherCharges',  label: 'Other Charges',    type: 'number' },
      { name: 'sellingPrice',  label: 'Selling Price *',  type: 'number' },
      { name: 'quantity',      label: 'Quantity *',       type: 'number' },
      { name: 'minQuantity',   label: 'Min. Quantity',    type: 'number' },
    ],
  },
  {
    title: 'Additional Notes',
    fields: [{ name: 'notes', label: 'Notes', type: 'textarea', col: 2 }],
  },
];

export default function InventoryForm() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = Boolean(id);
  const qc       = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => apiGet<any[]>('/categories'),
  });

  const { data: existing } = useQuery({
    queryKey: ['inventory', id],
    queryFn:  () => apiGet<any>(`/inventory/${id}`),
    enabled:  isEdit,
  });

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      metalType: 'GOLD', purity: 'K22',
      quantity: 1, minQuantity: 1,
      makingCharges: 0, otherCharges: 0,
    },
  });

  useEffect(() => { if (existing) reset(existing); }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEdit ? apiPut(`/inventory/${id}`, data) : apiPost('/inventory', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); navigate('/inventory'); },
  });

  const purchasePrice = watch('purchasePrice') || 0;
  const makingCharges = watch('makingCharges') || 0;
  const otherCharges  = watch('otherCharges')  || 0;
  const suggestedPrice = (Number(purchasePrice) + Number(makingCharges) + Number(otherCharges)) * 1.25;

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1
            className="text-xl font-bold text-foreground"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            {isEdit ? 'Edit Item' : 'Add Inventory Item'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEdit ? 'Update item information' : 'Fill in the details below to add a new item'}
          </p>
        </div>
      </div>

      {/* ── Form ───────────────────────────────────────── */}
      <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-4">
        {FIELD_GROUPS.map(group => (
          <div key={group.title} className="luxury-card p-5">
            <h2
              className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4 flex items-center gap-2"
            >
              <span
                className="inline-block w-3 h-0.5 rounded-full"
                style={{ background: '#C9A84C' }}
              />
              {group.title}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {group.fields.map((field: any) => (
                <div key={field.name} className={field.col === 2 ? 'sm:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {field.label}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      {...register(field.name as keyof FormData)}
                      rows={3}
                      className={textareaClass}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      {...register(field.name as keyof FormData)}
                      className={inputClass}
                    >
                      {field.name === 'categoryId' && <option value="">Select Category</option>}
                      {field.options?.map(([val, lbl]: [string, string]) => (
                        <option key={val} value={val}>{lbl}</option>
                      ))}
                      {field.name === 'categoryId' && categories?.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      {...register(field.name as keyof FormData)}
                      type={field.type}
                      step={field.type === 'number' ? '0.001' : undefined}
                      className={inputClass}
                    />
                  )}

                  {errors[field.name as keyof FormData] && (
                    <p className="mt-1.5 text-xs text-red-500">
     0                {(errors[field.name as keyof FormData] as any)?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Suggested price hint */}
        {suggestedPrice > 0 && (
          <div
            className="px-4 py-3 rounded-xl text-sm flex items-center gap-2.5"
            style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.2)',
              color: '#9e7b26',
            }}
          >
            <span>💡</span>
            <span>
              Suggested selling price (cost × 1.25):{' '}
              <strong className="font-semibold">${suggestedPrice.toFixed(2)}</strong>
            </span>
          </div>
        )}

        {mutation.isError && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-red-600 text-sm">
            {(mutation.error as any)?.response?.data?.message || 'Failed to save item. Please try again.'}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 disabled:pointer-events-none"
          >
            {(isSubmitting || mutation.isPending)
              ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
              : <><Save size={15} /> {isEdit ? 'Save Changes' : 'Add Item'}</>
            }
          </button>
        </div>
      </form>
    </div>
  );
}
