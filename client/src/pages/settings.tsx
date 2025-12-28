import { useBusiness, useUpdateBusiness, useWorkingDays, useUpdateWorkingDays } from "@/hooks/use-business";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Copy, Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SettingsPage() {
  const { data: business } = useBusiness();
  const { data: workingDays } = useWorkingDays();
  const updateBusiness = useUpdateBusiness();
  const updateWorkingDays = useUpdateWorkingDays();
  const { toast } = useToast();

  // Local state for working days form to handle inputs smoothly
  const [daysState, setDaysState] = useState<any[]>([]);

  useEffect(() => {
    if (workingDays) {
      setDaysState(workingDays);
    }
  }, [workingDays]);

  const handleCopyApiKey = () => {
    if (business?.apiKey) {
      navigator.clipboard.writeText(business.apiKey);
      toast({ title: "API Key copied to clipboard" });
    }
  };

  const handleBusinessUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await updateBusiness.mutateAsync({
        name: formData.get("name") as string,
        whatsapp: formData.get("whatsapp") as string,
      });
      toast({ title: "Business settings saved" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleWorkingDaysUpdate = async () => {
    try {
      await updateWorkingDays.mutateAsync(daysState.map(d => ({
        dayOfWeek: d.dayOfWeek,
        isOpen: d.isOpen,
        startTime: d.startTime,
        endTime: d.endTime,
      })));
      toast({ title: "Working hours saved" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold font-display text-slate-900">Settings</h2>
        <p className="text-slate-500">Configure your business details and preferences.</p>
      </div>

      {/* Business Details */}
      <Card className="glass-card border-none">
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Public details about your salon or shop.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBusinessUpdate} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input name="name" defaultValue={business?.name} required />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp / Phone</Label>
                <Input name="whatsapp" defaultValue={business?.whatsapp || ""} placeholder="+1234567890" />
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <Label>API Key</Label>
              <div className="flex gap-2 mt-2">
                <Input value={business?.apiKey || ""} readOnly className="font-mono bg-slate-50 text-slate-500" />
                <Button type="button" variant="outline" onClick={handleCopyApiKey}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Use this key to integrate your booking widget on your website.
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={updateBusiness.isPending}>
                {updateBusiness.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card className="glass-card border-none">
        <CardHeader>
          <CardTitle>Working Hours</CardTitle>
          <CardDescription>Set your weekly schedule. Uncheck days to close.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {daysState.sort((a,b) => a.dayOfWeek - b.dayOfWeek).map((day, index) => (
              <div key={day.dayOfWeek} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 border border-slate-100">
                <div className="flex items-center gap-4 w-40">
                  <Switch 
                    checked={day.isOpen} 
                    onCheckedChange={(checked) => {
                      const newDays = [...daysState];
                      newDays[index].isOpen = checked;
                      setDaysState(newDays);
                    }} 
                  />
                  <span className="font-medium text-slate-700">{DAYS[day.dayOfWeek]}</span>
                </div>
                
                {day.isOpen ? (
                  <div className="flex items-center gap-2">
                    <Input 
                      type="time" 
                      className="w-32 bg-white" 
                      value={day.startTime}
                      onChange={(e) => {
                        const newDays = [...daysState];
                        newDays[index].startTime = e.target.value;
                        setDaysState(newDays);
                      }}
                    />
                    <span className="text-slate-400">to</span>
                    <Input 
                      type="time" 
                      className="w-32 bg-white" 
                      value={day.endTime}
                      onChange={(e) => {
                        const newDays = [...daysState];
                        newDays[index].endTime = e.target.value;
                        setDaysState(newDays);
                      }}
                    />
                  </div>
                ) : (
                  <span className="text-slate-400 text-sm italic pr-4">Closed</span>
                )}
              </div>
            ))}

            <div className="flex justify-end pt-4">
              <Button onClick={handleWorkingDaysUpdate} disabled={updateWorkingDays.isPending}>
                {updateWorkingDays.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Schedule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
