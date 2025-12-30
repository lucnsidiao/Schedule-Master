import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, DollarSign, Users } from "lucide-react";

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold font-display text-slate-900">Reports</h2>
                <p className="text-slate-500">Business performance and analytics.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+12.5%</div>
                        <p className="text-xs text-muted-foreground">+2.1% from last month</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Ticket</CardTitle>
                        <DollarSign className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$84.20</div>
                        <p className="text-xs text-muted-foreground">+4.3% from last month</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">78%</div>
                        <p className="text-xs text-muted-foreground">+5.4% from last month</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="glass-card border-none">
                <CardHeader>
                    <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className="h-96 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Detailed analytics charts will appear here.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
