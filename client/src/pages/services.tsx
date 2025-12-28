import { useServices, useCreateService, useDeleteService, useUpdateService } from "@/hooks/use-services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Clock, DollarSign, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ServicesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const { toast } = useToast();

  const { data: services, isLoading } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      price: formData.get("price") as string, // Zod coerces to number via numeric
      duration: parseInt(formData.get("duration") as string),
      active: true,
    };

    try {
      if (editingService) {
        await updateService.mutateAsync({ id: editingService.id, ...data });
        toast({ title: "Service updated" });
      } else {
        await createService.mutateAsync(data);
        toast({ title: "Service created" });
      }
      setCreateOpen(false);
      setEditingService(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await deleteService.mutateAsync(id);
      toast({ title: "Service deleted" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-display text-slate-900">Services</h2>
          <p className="text-slate-500">Manage the services you offer.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setEditingService(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Service Name</Label>
                <Input name="name" defaultValue={editingService?.name} required placeholder="e.g. Haircut" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input name="price" type="number" step="0.01" defaultValue={editingService?.price} required placeholder="50.00" />
                </div>
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Input name="duration" type="number" defaultValue={editingService?.duration} required placeholder="60" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createService.isPending || updateService.isPending}>
                {(createService.isPending || updateService.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingService ? "Save Changes" : "Create Service"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services?.map((service) => (
            <Card key={service.id} className="glass-card hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold">{service.name}</CardTitle>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:text-indigo-600"
                    onClick={() => {
                      setEditingService(service);
                      setCreateOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:text-red-600"
                    onClick={() => handleDelete(service.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-md text-sm font-medium text-slate-600">
                    <DollarSign className="w-3.5 h-3.5" />
                    {service.price}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-md text-sm font-medium text-slate-600">
                    <Clock className="w-3.5 h-3.5" />
                    {service.duration} min
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
