import { Customer } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Phone, User as UserIcon, Loader2, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (customer: any) => {
      const res = await apiRequest("POST", "/api/customers", customer);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setCreateOpen(false);
      toast({ title: "Customer created successfully" });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Customer> }) => {
      const res = await apiRequest("PATCH", `/api/customers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setCreateOpen(false);
      setEditingCustomer(null);
      toast({ title: "Customer updated successfully" });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Customer deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete customer",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const filteredCustomers = customers?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
    };

    if (editingCustomer) {
      updateCustomerMutation.mutate({ id: editingCustomer.id, data });
    } else {
      createCustomerMutation.mutate(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return;
    deleteCustomerMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-slate-900">Customers</h2>
          <p className="text-slate-500">Manage your customer database.</p>
        </div>

        <Dialog open={createOpen} onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setEditingCustomer(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input name="name" defaultValue={editingCustomer?.name} placeholder="John Doe" required />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input name="phone" defaultValue={editingCustomer?.phone} placeholder="+1234567890" required />
              </div>
              <Button type="submit" className="w-full" disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}>
                {(createCustomerMutation.isPending || updateCustomerMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingCustomer ? "Save Changes" : "Create Customer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search customers by name or phone..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-slate-100 h-32" />
          ))
        ) : filteredCustomers?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            No customers found.
          </div>
        ) : (
          filteredCustomers?.map(customer => (
            <Card key={customer.id} className="glass-card hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <UserIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate text-slate-900">{customer.name}</h3>
                      <div className="flex items-center gap-2 text-slate-500 mt-1">
                        <Phone className="w-3 h-3" />
                        <span className="text-sm">{customer.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:text-indigo-600"
                      onClick={() => {
                        setEditingCustomer(customer);
                        setCreateOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:text-red-600"
                      onClick={() => handleDelete(customer.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
