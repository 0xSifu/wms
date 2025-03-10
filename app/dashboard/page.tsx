'use client';

import { AreaGraph } from '@/components/charts/area-graph';
import { BarGraph } from '@/components/charts/bar-graph';
import { PieGraph } from '@/components/charts/pie-graph';
import { CalendarDateRangePicker } from '@/components/date-range-picker';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';

interface Statistics {
  totalProducts: number;
  totalTagsScanned: number;
  totalTagsUnsync: number;
  totalTransactions: number;
  productsWithTags: number;
  productsWithoutTags: number;
  averageScansPerTag: number;
  lastScanTimestamp: string;
  mostScannedTag: {
    epc: string;
    scanCount: number;
  } | null;
  productWithMostTags: {
    productName: string;
    tagCount: number;
  } | null;
  transactionsLast24Hours: number;
  newTagsLast24Hours: number;
  dailyTransactions: Array<{ label: string; value: number }>;
  hourlyTransactions: Array<{ label: string; value: number }>;
  productTypeDistribution: Array<{ label: string; value: number }>;
  tagScanTrends: Array<{ label: string; value: number }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Statistics | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(
          'http://localhost:9001/api/v1/products/statistics'
        );
        const result = await response.json();
        setStats(result.data);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    };

    fetchStats();
  }, []);

  if (!stats) {
    return <div>Loading...</div>;
  }

  return (
    <PageContainer scrollable={true}>
      <div className="space-y-2">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            WMS Dashboard Overview 📊
          </h2>
          <div className="hidden items-center space-x-2 md:flex">
            <CalendarDateRangePicker />
            <Button>Download Report</Button>
          </div>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics" disabled>
              Analytics
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Products
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalProducts}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.productsWithTags} with tags
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Tags
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalTagsScanned}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalTagsUnsync} unsynced
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Transactions
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalTransactions}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.transactionsLast24Hours} in last 24h
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average Scans
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.averageScansPerTag.toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">scans per tag</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Daily Transactions</CardTitle>
                  <CardDescription>
                    Transaction trends over the past 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BarGraph
                    data={
                      stats.dailyTransactions.length > 0
                        ? stats.dailyTransactions
                        : [{ label: 'No Data', value: 0 }]
                    }
                  />
                </CardContent>
              </Card>
              <Card className="col-span-4 md:col-span-3">
                <CardHeader>
                  <CardTitle>Product Distribution</CardTitle>
                  <CardDescription>
                    Distribution by product type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PieGraph
                    data={
                      stats.productTypeDistribution.length > 0
                        ? stats.productTypeDistribution
                        : [{ label: 'No Data', value: 0 }]
                    }
                  />
                </CardContent>
              </Card>
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Hourly Activity</CardTitle>
                  <CardDescription>
                    Transaction activity by hour
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AreaGraph
                    data={
                      stats.hourlyTransactions.length > 0
                        ? stats.hourlyTransactions
                        : [{ label: 'No Data', value: 0 }]
                    }
                  />
                </CardContent>
              </Card>
              <Card className="col-span-4 md:col-span-3">
                <CardHeader>
                  <CardTitle>Most Active</CardTitle>
                  <CardDescription>Top performing items</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Most Scanned Tag</p>
                    <p className="text-2xl font-bold">
                      {stats.mostScannedTag?.epc || 'No data'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats.mostScannedTag?.scanCount || 0} scans
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Top Product</p>
                    <p className="text-2xl font-bold">
                      {stats.productWithMostTags?.productName || 'No data'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats.productWithMostTags?.tagCount || 0} transactions
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
