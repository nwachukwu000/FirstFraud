import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Loader2, TrendingUp, MapPin, Smartphone, Zap } from "lucide-react";
import { transactionsApi, alertsApi } from "@/lib/api";
import { format, subDays, startOfHour, eachHourOfInterval } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function BehavioralAnalytics() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("24h");
  const [deviationThreshold, setDeviationThreshold] = useState("high");
  const [flagNewPayee, setFlagNewPayee] = useState(true);

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    
    if (timeRange === "24h") {
      startDate = subDays(now, 1);
    } else if (timeRange === "7d") {
      startDate = subDays(now, 7);
    } else {
      startDate = subDays(now, 30);
    }
    
    return { startDate, endDate: now };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["behavioral-analytics", timeRange],
    queryFn: async () => {
      return transactionsApi.getList({
        page: 1,
        pageSize: 10000,
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      });
    },
  });

  const transactions = transactionsData?.items || [];

  // Behavioral Analytics - Hourly transaction patterns
  const hourlyData = useMemo(() => {
    if (timeRange !== "24h") return [];
    
    const hours = eachHourOfInterval({ start: startDate, end: endDate });
    return hours.map((hour) => {
      const hourStart = startOfHour(hour);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000 - 1);
      const hourTransactions = transactions.filter((t) => {
        const tDate = new Date(t.createdAt);
        return tDate >= hourStart && tDate <= hourEnd;
      });
      return {
        hour: format(hour, "HH:mm"),
        count: hourTransactions.length,
        highRisk: hourTransactions.filter((t) => (t.riskScore || 0) >= 50).length,
      };
    });
  }, [transactions, timeRange, startDate, endDate]);

  const maxCount = Math.max(...hourlyData.map((d) => d.count), 1);

  // Device Analytics
  const deviceData = useMemo(() => {
    const deviceMap = new Map<string, number>();
    transactions.forEach((t) => {
      const device = t.device || "Unknown";
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    });
    return Array.from(deviceMap.entries())
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [transactions]);

  const newDeviceCount = useMemo(() => {
    return transactions.filter((t) => t.device === "NewDevice").length;
  }, [transactions]);

  // Geolocation Analytics
  const locationData = useMemo(() => {
    const locationMap = new Map<string, { count: number; highRisk: number }>();
    transactions.forEach((t) => {
      const location = t.location || "Unknown";
      const current = locationMap.get(location) || { count: 0, highRisk: 0 };
      locationMap.set(location, {
        count: current.count + 1,
        highRisk: current.highRisk + ((t.riskScore || 0) >= 50 ? 1 : 0),
      });
    });
    return Array.from(locationMap.entries())
      .map(([location, data]) => ({ location, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [transactions]);

  // Velocity Checks - Transactions per account
  const velocityData = useMemo(() => {
    const accountMap = new Map<string, { count: number; totalAmount: number; timeSpan: number }>();
    transactions.forEach((t) => {
      const account = t.senderAccountNumber;
      const current = accountMap.get(account) || { count: 0, totalAmount: 0, timeSpan: 0 };
      const tDate = new Date(t.createdAt).getTime();
      const firstDate = current.timeSpan === 0 ? tDate : Math.min(current.timeSpan, tDate);
      accountMap.set(account, {
        count: current.count + 1,
        totalAmount: current.totalAmount + (t.amount || 0),
        timeSpan: firstDate,
      });
    });

    return Array.from(accountMap.entries())
      .map(([account, data]) => {
        const timeSpanHours = (endDate.getTime() - data.timeSpan) / (1000 * 60 * 60);
        const transactionsPerHour = timeSpanHours > 0 ? data.count / timeSpanHours : data.count;
        return {
          account,
          count: data.count,
          totalAmount: data.totalAmount,
          transactionsPerHour,
          isHighVelocity: transactionsPerHour > 5 || data.count > 10,
        };
      })
      .filter((v) => v.isHighVelocity)
      .sort((a, b) => b.transactionsPerHour - a.transactionsPerHour)
      .slice(0, 10);
  }, [transactions, endDate]);

  const handleUpdateSettings = () => {
    toast({
      title: "Success",
      description: "Settings updated successfully",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Behavioral & Device Analytics</h1>
            <p className="text-muted-foreground">Visualize and configure analytics for user behavior, devices, and more.</p>
          </div>
        </div>

        <Tabs defaultValue="behavioral" className="space-y-4">
          <TabsList>
            
            <TabsTrigger value="device">Device Fingerprinting</TabsTrigger>
            <TabsTrigger value="geolocation">Geolocation</TabsTrigger>
           
          </TabsList>


          <TabsContent value="device">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Device Distribution
                  </CardTitle>
                  <CardDescription>Most common devices used for transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="flex h-[300px] items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : deviceData.length > 0 ? (
                    <div className="space-y-4">
                      {deviceData.map((item, index) => {
                        const total = deviceData.reduce((sum, d) => sum + d.count, 0);
                        const percentage = ((item.count / total) * 100).toFixed(1);
                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{item.device}</span>
                              <span className="text-muted-foreground">
                                {item.count} ({percentage}%)
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No device data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>New Device Detection</CardTitle>
                  <CardDescription>Transactions from new or unrecognized devices</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="flex h-[200px] items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-destructive">{newDeviceCount}</div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Transactions from new devices
                        </p>
                      </div>
                      <div className="rounded-lg border p-4 bg-yellow-50 dark:bg-yellow-950">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          New device transactions may indicate account compromise or unauthorized access.
                          Review these transactions carefully.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="geolocation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Geolocation Analysis
                </CardTitle>
                <CardDescription>Monitor geographic patterns and detect unusual locations</CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="flex h-[400px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : locationData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {locationData.map((item, index) => {
                        const riskPercentage = item.count > 0 ? ((item.highRisk / item.count) * 100).toFixed(1) : "0";
                        return (
                          <div key={index} className="rounded-lg border p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">{item.location}</span>
                              <span className="text-sm text-muted-foreground">{item.count} transactions</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>High Risk Transactions</span>
                                <span className="font-medium text-destructive">
                                  {item.highRisk} ({riskPercentage}%)
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-muted">
                                <div
                                  className="h-2 rounded-full bg-destructive"
                                  style={{ width: `${riskPercentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No location data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          
        </Tabs>
      </div>
    </AppLayout>
  );
}
