export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold mt-2">$45,231.89</p>
          <p className="text-xs text-green-600 mt-1">+20.1% from last month</p>
        </div>
        
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Orders</h3>
          <p className="text-2xl font-bold mt-2">+2,350</p>
          <p className="text-xs text-green-600 mt-1">+18.0% from last month</p>
        </div>
        
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Active Products</h3>
          <p className="text-2xl font-bold mt-2">573</p>
          <p className="text-xs text-gray-500 mt-1">12 added this week</p>
        </div>
      </section>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
        <div className="text-sm text-gray-600">Order table will be here...</div>
      </div>
    </div>
  );
}
