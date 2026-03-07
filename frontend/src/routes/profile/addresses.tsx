import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ArrowLeft, Plus, Edit2, Trash2, Star, MapPin, Loader2 } from 'lucide-react'
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type Address,
  type AddressCreateRequest,
  type AddressUpdateRequest,
} from '@/api/addresses'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox'

export const Route = createFileRoute('/profile/addresses')({
  component: AddressesPage,
})

const BD_DISTRICTS = [
  'Barisal', 'Bogra', 'Brahmanbaria', 'Chittagong', 'Comilla', 'Cox\'s Bazar',
  'Dhaka', 'Dinajpur', 'Gazipur', 'Jamalpur', 'Jessore', 'Khulna', 'Mymensingh',
  'Narayanganj', 'Narsingdi', 'Noakhali', 'Pabna', 'Rajshahi', 'Rangamati',
  'Rangpur', 'Savar', 'Sylhet', 'Tangail', 'Tongi',
].sort()

const EMPTY_FORM: AddressCreateRequest = {
  label: 'Home',
  full_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  district: '',
  postal_code: '',
  country: 'Bangladesh',
  is_default: false,
}

function AddressesPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [form, setForm] = useState<AddressCreateRequest>(EMPTY_FORM)

  const { data, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => getAddresses(),
  })

  const createMutation = useMutation({
    mutationFn: (d: AddressCreateRequest) => createAddress({ data: d }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['addresses'] }); resetForm() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: AddressUpdateRequest }) =>
      updateAddress({ data: { addressId: id, updates } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['addresses'] }); resetForm() },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAddress({ data: { addressId: id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  })

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => setDefaultAddress({ data: { addressId: id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  })

  const resetForm = () => {
    setShowForm(false)
    setEditingAddress(null)
    setForm(EMPTY_FORM)
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    setForm({
      label: address.label,
      full_name: address.full_name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      district: address.district,
      postal_code: address.postal_code || '',
      country: address.country,
      is_default: address.is_default,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingAddress) {
      updateMutation.mutate({ id: editingAddress.id, updates: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const addresses = data?.data?.addresses || []
  const maxAddresses = data?.data?.max_allowed || 5
  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            to="/profile"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Profile
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Addresses</h1>
            <p className="text-sm text-gray-500 mt-0.5">{addresses.length} of {maxAddresses} addresses saved</p>
          </div>
          {!showForm && addresses.length < maxAddresses && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-header text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              Add Address
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-5">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Label</Label>
                  <Combobox
                    options={[
                      { value: 'Home',   label: 'Home' },
                      { value: 'Office', label: 'Office' },
                      { value: 'Other',  label: 'Other' },
                    ]}
                    value={form.label}
                    onChange={(v) => setForm(f => ({ ...f, label: v || 'Home' }))}
                    placeholder="Select label"
                    searchPlaceholder="Search..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    value={form.full_name}
                    onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
                    required
                    placeholder="Recipient full name"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Phone <span className="text-red-500">*</span></Label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    required
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>District <span className="text-red-500">*</span></Label>
                  <Combobox
                    options={BD_DISTRICTS.map(d => ({ value: d, label: d }))}
                    value={form.district}
                    onChange={(v) => setForm(f => ({ ...f, district: v }))}
                    placeholder="Select district"
                    searchPlaceholder="Search district..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Address <span className="text-red-500">*</span></Label>
                <textarea
                  value={form.address_line1}
                  onChange={(e) => setForm(f => ({ ...f, address_line1: e.target.value }))}
                  required
                  rows={2}
                  placeholder="House/Flat No., Street, Area"
                  className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-header/20 focus:border-header transition-colors resize-none"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>City <span className="text-red-500">*</span></Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                    required
                    placeholder="Enter city"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Postal Code</Label>
                  <Input
                    value={form.postal_code}
                    onChange={(e) => setForm(f => ({ ...f, postal_code: e.target.value }))}
                    placeholder="e.g. 1200"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => setForm(f => ({ ...f, is_default: e.target.checked }))}
                  className="rounded border-gray-300 text-header focus:ring-header/20"
                />
                <span className="text-sm text-gray-700">Set as default address</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 bg-header text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {isPending && <Loader2 size={14} className="animate-spin" />}
                  {editingAddress ? 'Update Address' : 'Save Address'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Address List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-header" />
          </div>
        ) : addresses.length === 0 && !showForm ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No addresses saved yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-header text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90"
            >
              <Plus size={16} />
              Add Your First Address
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <div key={address.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-header bg-header/10 px-2 py-0.5 rounded-full">
                      {address.label}
                    </span>
                    {address.is_default && (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <Star size={10} fill="currentColor" />
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(address)}
                      className="p-1.5 text-gray-400 hover:text-header hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(address.id)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                </div>

                <p className="font-medium text-gray-900 text-sm">{address.full_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{address.phone}</p>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                  {address.address_line1}
                  {address.address_line2 && `, ${address.address_line2}`}
                </p>
                <p className="text-xs text-gray-600">
                  {address.city}, {address.district}
                  {address.postal_code && ` - ${address.postal_code}`}
                </p>

                {!address.is_default && (
                  <button
                    onClick={() => setDefaultMutation.mutate(address.id)}
                    disabled={setDefaultMutation.isPending}
                    className="mt-3 text-xs text-header hover:underline disabled:opacity-50"
                  >
                    Set as default
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
