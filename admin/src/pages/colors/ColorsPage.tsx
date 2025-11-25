import { useState, useEffect } from "react"
import { AdminLayout } from "@/layouts/AdminLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { IconEdit, IconTrash, IconPlus, IconSearch } from "@tabler/icons-react"
import { colorService } from "@/services/colorService"
import type { Color, ColorFormData } from "@/services/colorService"
import { toast } from "sonner"

export default function ColorsPage() {
    const [colors, setColors] = useState<Color[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingColor, setEditingColor] = useState<Color | null>(null)
    const [formData, setFormData] = useState<ColorFormData>({
        name: "",
        hex: "#000000",
        isActive: true,
    })

    useEffect(() => {
        fetchColors()
    }, [])

    const fetchColors = async () => {
        try {
            setLoading(true)
            const response = await colorService.getAllColors()
            if (response.success) {
                setColors(response.data)
            }
        } catch (error) {
            console.error("Error fetching colors:", error)
            toast.error("Failed to fetch colors")
        } finally {
            setLoading(false)
        }
    }

    const handleOpenDialog = (color?: Color) => {
        if (color) {
            setEditingColor(color)
            setFormData({
                name: color.name,
                hex: color.hex,
                isActive: color.isActive,
            })
        } else {
            setEditingColor(null)
            setFormData({
                name: "",
                hex: "#000000",
                isActive: true,
            })
        }
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingColor) {
                await colorService.updateColor(editingColor._id, formData)
                toast.success("Color updated successfully")
            } else {
                await colorService.createColor(formData)
                toast.success("Color created successfully")
            }
            setIsDialogOpen(false)
            fetchColors()
        } catch (error: any) {
            console.error("Error saving color:", error)
            toast.error(error.response?.data?.message || "Failed to save color")
        }
    }

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this color?")) {
            try {
                await colorService.deleteColor(id)
                toast.success("Color deleted successfully")
                fetchColors()
            } catch (error) {
                console.error("Error deleting color:", error)
                toast.error("Failed to delete color")
            }
        }
    }

    const filteredColors = colors.filter(
        (color) =>
            color.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            color.hex.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <AdminLayout title="Colors">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="relative w-72">
                        <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search colors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <IconPlus className="mr-2 h-4 w-4" />
                        Add Color
                    </Button>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Preview</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Hex Code</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        Loading colors...
                                    </TableCell>
                                </TableRow>
                            ) : filteredColors.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No colors found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredColors.map((color) => (
                                    <TableRow key={color._id}>
                                        <TableCell>
                                            <div
                                                className="w-8 h-8 rounded border shadow-sm"
                                                style={{ backgroundColor: color.hex }}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{color.name}</TableCell>
                                        <TableCell className="font-mono text-xs">{color.hex}</TableCell>
                                        <TableCell>
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${color.isActive
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-gray-100 text-gray-800"
                                                    }`}
                                            >
                                                {color.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDialog(color)}
                                                >
                                                    <IconEdit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(color._id)}
                                                >
                                                    <IconTrash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingColor ? "Edit Color" : "Add New Color"}</DialogTitle>
                            <DialogDescription>
                                {editingColor
                                    ? "Update color details below."
                                    : "Add a new color to your store."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Color Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Navy Blue"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hex">Hex Code</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="hex"
                                        placeholder="#000000"
                                        value={formData.hex}
                                        onChange={(e) => setFormData({ ...formData, hex: e.target.value })}
                                        required
                                        className="font-mono"
                                    />
                                    <Input
                                        type="color"
                                        value={formData.hex.length === 7 ? formData.hex : "#000000"}
                                        onChange={(e) => setFormData({ ...formData, hex: e.target.value.toUpperCase() })}
                                        className="w-12 h-10 p-1 cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label>Active Status</Label>
                                    <div className="text-sm text-muted-foreground">
                                        Enable or disable this color
                                    </div>
                                </div>
                                <Switch
                                    checked={formData.isActive}
                                    onCheckedChange={(checked: boolean) =>
                                        setFormData({ ...formData, isActive: checked })
                                    }
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Save Color</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    )
}
