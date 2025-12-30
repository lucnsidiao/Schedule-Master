import { Customer } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Phone, User as UserIcon, Loader2 } from "lucide-react";
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

  const filteredCustomers = customers?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  const handleCreateCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
    };
    createCustomerMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-slate-900">Customers</h2>
          <p className="text-slate-500">Manage your customer database.</p>
        </div>
        
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCustomer} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input name="name" placeholder="John Doe" required />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input name="phone" placeholder="+1234567890" required />
              </div>
              <Button type="submit" className="w-full" disabled={createCustomerMutation.isPending}>
                {createCustomerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Customer
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
            <Card key={customer.id} className="hover-elevate cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
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
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
