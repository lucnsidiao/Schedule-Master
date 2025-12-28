import { useStats } from "@/hooks/use-appointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { 
  Users, 
  DollarSign, 
  CalendarCheck, 
  AlertCircle,
  TrendingUp,
  Clock
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

export default function Dashboard() {
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  // Mock data for chart since backend doesn't provide historical data yet
  const chartData = [
    { name: 'Mon', revenue: 400 },
    { name: 'Tue', revenue: 300 },
    { name: 'Wed', revenue: 600 },
    { name: 'Thu', revenue: 800 },
    { name: 'Fri', revenue: 500 },
    { name: 'Sat', revenue: 900 },
    { name: 'Sun', revenue: 400 },
  ];

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <Card className="glass-card overflow-hidden relative">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl -mr-12 -mt-12`} />
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <h3 className="text-2xl font-bold mt-2 text-slate-900">{value}</h3>
            {trend && (
              <div className="flex items-center gap-1 mt-1 text-emerald-600 text-xs font-medium">
                <TrendingUp className="w-3 h-3" />
                <span>{trend}</span>
              </div>
            )}
          </div>
          <div className={`p-3 bg-${color}-50 text-${color}-600 rounded-xl`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-display text-slate-900">Dashboard</h2>
        <p className="text-slate-500 mt-1">Here's what's happening in your business today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Today's Appointments" 
          value={stats?.todayCount || 0}
          icon={CalendarCheck}
          color="indigo"
          trend="+12% from yesterday"
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${stats?.revenue || 0}`}
          icon={DollarSign}
          color="emerald"
          trend="+8% from last week"
        />
        <StatCard 
          title="No-Shows" 
          value={stats?.noShows || 0}
          icon={AlertCircle}
          color="rose"
        />
        <StatCard 
          title="Total Clients" 
          value="1,203" // Mock value
          icon={Users}
          color="blue"
          trend="+24 new this month"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Bookings */}
        <Card className="lg:col-span-2 glass-card border-none">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentBookings.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No bookings yet</div>
              ) : (
                stats?.recentBookings.map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                        {booking.client.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{booking.client.name}</p>
                        <p className="text-sm text-slate-500">{booking.service.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {format(new Date(booking.startAt), "h:mm a")}
                      </div>
                      <p className="text-xs text-slate-500">
                        {format(new Date(booking.startAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="glass-card border-none">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `$${value}`} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
