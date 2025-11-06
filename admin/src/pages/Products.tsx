export default function Products() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <button className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm hover:bg-gray-800 transition-colors">
          + Add Product
        </button>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <div className="text-sm text-gray-600">
          Product list and management table will be here...
        </div>
      </div>
    </div>
  );
}
