"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useState, useEffect } from "react"
import { fetchAPI } from "@/lib/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig, } from "@/components/ui/chart"
import { Pie, PieChart } from "recharts";


const chartConfig1 = {
  desktop: {
    label: "Pedidos",
    color: "#3b82f6",
  },
} satisfies ChartConfig

const chartConfig2 = {
  desktop: {
    label: "Clientes",
    color: "#3b82f6",
  },

  } satisfies ChartConfig

  const chartConfig3 = {
  visitors: { label: "Pedidos" },
} satisfies ChartConfig;

export default function DashboardPage() {
  const [chartDataMes, setChartDataMes] = useState<any[]>([]);
  const [chartDataClientes, setChartDataClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartDataCategorias, setChartDataCategorias] = useState<any[]>([]);
 
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
  setLoading(true);
  await Promise.all([loadPedidosPorMes(), loadTopClientes(), loadCategorias()]);
  setLoading(false);
};

  const loadPedidosPorMes = async () => {
    try {
      const data = await fetchAPI('/orders?filters[order_status][$eq]=pagado&pagination[pageSize]=1000');
      
      const today = new Date();
      const last5Months: { key: string; label: string }[] = [];
      
      for (let i = 4; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
        const label = d.toLocaleDateString('es-CO', { month: 'short' });
        last5Months.push({ key, label });
      }
      
      const groupedByMonth: Record<string, number> = {};
      last5Months.forEach(m => { groupedByMonth[m.key] = 0; });
      
      if (data.data && data.data.length > 0) {
        data.data.forEach((order: any) => {
          const attrs = order.attributes || order;
          const date = new Date(attrs.due_date || attrs.updatedAt || order.createdAt);
          const month = date.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
          
          if (groupedByMonth.hasOwnProperty(month)) {
            groupedByMonth[month] += 1;
          }
        });
      }
      
      const formatted = last5Months.map(m => ({
        month: m.label.replace('.', ''),
        desktop: groupedByMonth[m.key],
      }));

      setChartDataMes(formatted);
    } catch (error) {
      console.error("Error:", error);
      setChartDataMes([]);
    }
  };

  const loadTopClientes = async () => {
    try {
      const data = await fetchAPI('/orders?filters[order_status][$eq]=pagado&populate=client&pagination[pageSize]=1000');
      
      if (data.data && data.data.length > 0) {
        const clientCount: Record<string, number> = {};
        
        data.data.forEach((order: any) => {
          const attrs = order.attributes || order;
          const clientName = attrs.client?.data?.attributes?.name || attrs.client?.name || attrs.client_name || "Sin cliente";
          clientCount[clientName] = (clientCount[clientName] || 0) + 1;
        });
        
        const sorted = Object.entries(clientCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6)
          .map(([name, count]) => ({
            month: name,
            desktop: count,
          }));

        setChartDataClientes(sorted);
      } else {
        setChartDataClientes([]);
      }
    } catch (error) {
      console.error("Error:", error);
      setChartDataClientes([]);
    }
  };

  const loadCategorias = async () => {
  try {
    const data = await fetchAPI('/orders?filters[order_status][$eq]=pagado&populate=product_items.product.categories&pagination[pageSize]=1000');
    
    // Mapa de colores fijos por categoría
    const colorMap: Record<string, string> = {
      "Tienda Detalles": "#3b82f6",
      "Croydon": "#10b981",
      "Elede": "#f59e0b",
      "Bel-Start": "#ef4444",
      "Natura-Avon": "#8b5cf6",
      "Yambal": "#ec4899",
      "Marketin": "#06b6d4",
      "Alquiler Inmoviliario": "#84cc16",
      "Perfumeria AAA": "#f97316",
      "Azzorti": "#6366f1",
    };
    
    if (data.data && data.data.length > 0) {
      const catCount: Record<string, number> = {};
      
      data.data.forEach((order: any) => {
        const attrs = order.attributes || order;
        const items = attrs.product_items || [];
        items.forEach((item: any) => {
          const catName = item.product?.categories?.[0]?.name || "Sin categoría";
          catCount[catName] = (catCount[catName] || 0) + 1;
        });
      });
      
      const formatted = Object.entries(catCount).map(([name, count]) => ({
        browser: name,
        visitors: count,
        fill: colorMap[name] || "#94a3b8",
      }));

      setChartDataCategorias(formatted);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

  if (loading) return <p className="text-center py-10">Cargando datos...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl lg:text-3xl font-bold dark:text-white">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Pedidos por mes */}
        <Card className="font-bold h-100 w-100">
          <CardHeader>
            <CardTitle>Pedidos por mes</CardTitle>
            <CardDescription>Pedidos realizados cada mes</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig1}>
              <BarChart accessibilityLayer data={chartDataMes}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8} maxBarSize={40} />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 leading-none font-medium">
              Total: {chartDataMes.reduce((sum, item) => sum + item.desktop, 0)} pedidos <TrendingUp className="h-4 w-4" />
            </div>
            <div className="leading-none text-muted-foreground">Teniendo en cuenta todas las categorías</div>
          </CardFooter>
        </Card>

        {/* Gráfico 2: Top Clientes */}
        <Card className="font-bold h-100 w-100">
          <CardHeader>
            <CardTitle>Top Clientes</CardTitle>
            <CardDescription>Clientes con más pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig2}>
              <BarChart
                accessibilityLayer
                data={chartDataClientes}
                layout="vertical"
                margin={{ left: -10 }}
              >
                <XAxis type="number" dataKey="desktop" hide />
                <YAxis
                  dataKey="month"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + '...' : value}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={5} maxBarSize={40} />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 leading-none font-medium">
              Top {chartDataClientes.length} clientes <TrendingUp className="h-4 w-4" />
            </div>
            <div className="leading-none text-muted-foreground">Clientes que más pedidos han realizado</div>
          </CardFooter>
        </Card>

        {/* Gráfico 3: Categorías */}
<Card className="flex flex-col h-100 h-100"  >
  <CardHeader className="items-center pb-0">
    <CardTitle>Categorías</CardTitle>
    <CardDescription>Pedidos por categoría</CardDescription>
  </CardHeader>
  <CardContent className="flex-1 pb-0">
    <ChartContainer
      config={chartConfig3}
      className="mx-auto aspect-square max-h-[250px] pb-0 [&_.recharts-pie-label-text]:fill-foreground"
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie data={chartDataCategorias} dataKey="visitors" label nameKey="browser" />
      </PieChart>
    </ChartContainer>
  </CardContent>
  <CardFooter className="flex-col gap-2 text-sm">
    <div className="flex items-center gap-2 leading-none font-medium">
      Total categorías: {chartDataCategorias.length} <TrendingUp className="h-4 w-4" />
    </div>
    <div className="leading-none text-muted-foreground">
      Distribución de pedidos por categoría
    </div>
  </CardFooter>
</Card>
      </div>
    </div>
  )
}