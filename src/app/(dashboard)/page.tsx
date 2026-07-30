"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Area, AreaChart } from "recharts"
import { useState, useEffect } from "react"
import { fetchAPI } from "@/lib/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconShoppingBag, IconUsers, IconCurrencyDollar, IconClipboardCheck } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"


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
} satisfies ChartConfig

const chartConfig4 = {
  desktop: {
    label: "Ingresos",
    color: "#3b82f6",
  },
} satisfies ChartConfig

export default function DashboardPage() {
  const [chartDataMes, setChartDataMes] = useState<any[]>([]);
  const [chartDataClientes, setChartDataClientes] = useState<any[]>([]);
  const [chartDataCategorias, setChartDataCategorias] = useState<any[]>([]);
  const [chartDataDiario, setChartDataDiario] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("todos");
  const [availableMonths, setAvailableMonths] = useState<{ key: string; label: string }[]>([]);
  const [timeRange, setTimeRange] = useState("30d");
  const [stats, setStats] = useState({
    totalPedidos: 0,
    pedidosPagados: 0,
    pedidosPendientes: 0,
    totalClientes: 0,
    ingresosTotales: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadStats();
  }, [selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadPedidosPorMes(), loadTopClientes(), loadCategorias(), loadStats(), loadPagosPorDia()]);
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const [ordersData, clientsData] = await Promise.all([
        fetchAPI('/orders?pagination[pageSize]=1000'),
        fetchAPI('/clients?pagination[pageSize]=1000'),
      ]);

      const orders = ordersData.data || [];
      const clients = clientsData.data || [];

      const mesesUnicos = new Set<string>();
      const mesesArray: { key: string; label: string }[] = [];
      
      orders.forEach((o: any) => {
        const d = new Date(o.due_date || o.updatedAt || o.createdAt);
        const key = d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
        const label = d.toLocaleDateString('es-CO', { month: 'long' });
        const mesStr = JSON.stringify({ key, label });
        if (!mesesUnicos.has(mesStr)) {
          mesesUnicos.add(mesStr);
          mesesArray.push({ key, label });
        }
      });
      
      const mesesOrden = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      mesesArray.sort((a, b) => mesesOrden.indexOf(a.key) - mesesOrden.indexOf(b.key));
      
      setAvailableMonths([{ key: "todos", label: "Todos los meses" }, ...mesesArray]);

      const filteredOrders = selectedMonth === "todos" ? orders : orders.filter((o: any) => {
        const d = new Date(o.due_date || o.updatedAt || o.createdAt);
        return d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '') === selectedMonth;
      });

      const pagados = filteredOrders.filter((o: any) => o.order_status === 'pagado');
      const pendientes = filteredOrders.filter((o: any) => o.order_status === 'pendiente');
      const ingresos = pagados.reduce((sum: number, o: any) => sum + (o.total || 0), 0);

      setStats({
        totalPedidos: filteredOrders.length,
        pedidosPagados: pagados.length,
        pedidosPendientes: pendientes.length,
        totalClientes: clients.length,
        ingresosTotales: ingresos,
      });
    } catch (error) {
      console.error("Error cargando stats:", error);
    }
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
      
      const colorMap: Record<string, string> = {
  "Tienda Detalles": "#93c5fd",
  "Croydon": "#6ee7b7",
  "Elede": "#fcd34d",
  "Bel-Start": "#fca5a5",
  "Natura-Avon": "#c4b5fd",
  "Yambal": "#f9a8d4",
  "Marketin": "#67e8f9",
  "Alquiler Inmoviliario": "#bef264",
  "Perfumeria AAA": "#fdba74",
  "Azzorti": "#a5b4fc",
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

  const loadPagosPorDia = async () => {
    try {
      const data = await fetchAPI('/orders?filters[order_status][$eq]=pagado&pagination[pageSize]=1000');
      
      if (data.data && data.data.length > 0) {
        const dailyTotals: Record<string, number> = {};
        
        data.data.forEach((order: any) => {
          const attrs = order.attributes || order;
          const date = new Date(attrs.due_date || attrs.updatedAt || order.createdAt);
          const dateStr = date.toISOString().split('T')[0];
          dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + (attrs.total || 0);
        });
        
        const formatted = Object.entries(dailyTotals)
          .map(([date, total]) => ({ date, desktop: total }))
          .sort((a, b) => a.date.localeCompare(b.date));
        
        setChartDataDiario(formatted);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const filteredDataDiario = chartDataDiario.filter((item) => {
    const date = new Date(item.date);
    const now = new Date();
    let daysToSubtract = 90;
    if (timeRange === "30d") daysToSubtract = 30;
    if (timeRange === "7d") daysToSubtract = 7;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  if (loading) return <p className="text-center py-10">Cargando datos...</p>;

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold dark:text-white">Dashboard</h1>
        
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border rounded-md p-2 text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600 w-full sm:w-auto"
        >
          {availableMonths.map((m) => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs md:text-sm">Total Pedidos</CardDescription>
            <CardTitle className="text-xl md:text-2xl font-semibold tabular-nums">{stats.totalPedidos}</CardTitle>
            <CardAction>
              <Badge variant="outline" className="text-xs gap-1">
                <IconShoppingBag className="size-3" />
                {stats.pedidosPagados} pagados
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-xs md:text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {stats.pedidosPendientes} pendientes
            </div>
            <div className="text-muted-foreground">Total de pedidos registrados</div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs md:text-sm">Ingresos Totales</CardDescription>
            <CardTitle className="text-xl md:text-2xl font-semibold tabular-nums">${stats.ingresosTotales.toLocaleString('es-CO')}</CardTitle>
            <CardAction>
              <Badge variant="outline" className="text-xs gap-1">
                <IconCurrencyDollar className="size-3" />
                COP
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-xs md:text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Ingresos acumulados
            </div>
            <div className="text-muted-foreground">Pedidos pagados</div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs md:text-sm">Clientes</CardDescription>
            <CardTitle className="text-xl md:text-2xl font-semibold tabular-nums">{stats.totalClientes}</CardTitle>
            <CardAction>
              <Badge variant="outline" className="text-xs gap-1">
                <IconUsers className="size-3" />
                Activos
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-xs md:text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Clientes registrados
            </div>
            <div className="text-muted-foreground">Base de clientes</div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs md:text-sm">Pendientes</CardDescription>
            <CardTitle className="text-xl md:text-2xl font-semibold tabular-nums">{stats.pedidosPendientes}</CardTitle>
            <CardAction>
              <Badge variant="outline" className="text-xs gap-1">
                <IconClipboardCheck className="size-3" />
                Por cobrar
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-xs md:text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Pendientes de pago
            </div>
            <div className="text-muted-foreground">Pedidos sin pagar</div>
          </CardFooter>
        </Card>
      </div>

      {/* Gráfico de Área - Pagos por día */}
      <Card>
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle className="text-base md:text-lg">Pagos por día</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Ingresos diarios de pedidos pagados
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[130px] md:w-[160px] rounded-lg text-xs md:text-sm">
              <SelectValue placeholder="Últimos 30 días" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg text-xs md:text-sm">Últimos 3 meses</SelectItem>
              <SelectItem value="30d" className="rounded-lg text-xs md:text-sm">Últimos 30 días</SelectItem>
              <SelectItem value="7d" className="rounded-lg text-xs md:text-sm">Últimos 7 días</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer config={chartConfig4} className="aspect-auto h-[200px] md:h-[250px] w-full">
            <AreaChart data={filteredDataDiario}>
              <defs>
                <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("es-CO", { month: "short", day: "numeric" })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("es-CO", { month: "long", day: "numeric" })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="desktop"
                type="natural"
                fill="url(#fillDesktop)"
                stroke="var(--color-desktop)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        
        <Card>
          <CardHeader className="pb-2 md:pb-6">
            <CardTitle className="text-base md:text-lg">Pedidos por mes</CardTitle>
            <CardDescription className="text-xs md:text-sm">Pedidos realizados cada mes</CardDescription>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <ChartContainer config={chartConfig1} className="h-[180px] md:h-[200px] w-full">
              <BarChart accessibilityLayer data={chartDataMes}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                  tick={{ fontSize: 10 }}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="desktop" fill="url(#fillDesktop)" radius={8} maxBarSize={30} />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-1.5 text-xs md:text-sm px-2 md:px-6">
            <div className="flex gap-2 leading-none font-medium">
              Total: {chartDataMes.reduce((sum, item) => sum + item.desktop, 0)} pedidos <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
            </div>
            <div className="leading-none text-muted-foreground">Teniendo en cuenta todas las categorías</div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2 md:pb-6">
            <CardTitle className="text-base md:text-lg">Top Clientes</CardTitle>
            <CardDescription className="text-xs md:text-sm">Clientes con más pedidos</CardDescription>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <ChartContainer config={chartConfig2} className="h-[180px] md:h-[200px] w-full">
              <BarChart
                accessibilityLayer
                data={chartDataClientes}
                layout="vertical"
                margin={{ left: -10, right: 10 }}
              >
                <XAxis type="number" dataKey="desktop" hide />
                <YAxis
                  dataKey="month"
                  type="category"
                  tickLine={false}
                  tickMargin={5}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  width={80}
                  tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + '...' : value}
                /><defs>
                  <linearGradient id="fillBarClientes" x1="1" y1="0" x2="0" y2="0">
                   <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8} />
                   <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
                   </linearGradient>
                  </defs>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="desktop" fill="url(#fillBarClientes)" radius={5} maxBarSize={20} />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-1.5 text-xs md:text-sm px-2 md:px-6">
            <div className="flex gap-2 leading-none font-medium">
              Top {chartDataClientes.length} clientes <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
            </div>
            <div className="leading-none text-muted-foreground">Clientes que más pedidos han realizado</div>
          </CardFooter>
        </Card>

        <Card className="flex flex-col md:col-span-2 lg:col-span-1">
          <CardHeader className="items-center pb-0 md:pb-2">
            <CardTitle className="text-base md:text-lg">Categorías</CardTitle>
            <CardDescription className="text-xs md:text-sm">Pedidos por categoría</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0 px-2 md:px-6">
            <ChartContainer
              config={chartConfig3}
              className="mx-auto aspect-square max-h-[180px] md:max-h-[220px] pb-0 [&_.recharts-pie-label-text]:fill-foreground"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={chartDataCategorias} dataKey="visitors" label nameKey="browser" />
              </PieChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-1.5 text-xs md:text-sm px-2 md:px-6">
            <div className="flex items-center gap-2 leading-none font-medium">
              Total categorías: {chartDataCategorias.length} <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
            </div>
            <div className="leading-none text-muted-foreground text-center text-xs">
              Distribución de pedidos por categoría
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}