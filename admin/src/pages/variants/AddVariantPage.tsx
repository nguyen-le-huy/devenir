import { useParams, useNavigate } from 'react-router-dom'
import { AdminLayout } from '@/layouts/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProductForm } from '@/components/products/ProductForm'

export default function AddVariantPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const handleBack = () => {
    navigate('/admin/variants')
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEdit ? 'Edit Variant' : 'Add New Variant'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Modify variant details and inventory' : 'Create a new product variant'}
            </p>
          </div>
          <Button variant="outline" onClick={handleBack}>
            ← Back to Variants
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? 'Edit Variant' : 'New Variant'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
