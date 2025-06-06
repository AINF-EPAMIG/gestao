"use client"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts"
import { useState, useEffect, useMemo, ReactNode } from "react"
import { Loader2 } from "lucide-react"

interface ChartData {
  date: string;
  TarefasCriadas: number;
  AtualizacoesStatus: number;
  "Tarefas Criadas"?: number;
  "Atualizações de Status"?: number;
}

interface PayloadItem {
  name: string;
  value: number;
  color: string;
  payload: ChartData;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string;
}

// Componente personalizado para o tooltip
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "";
    
    try {
      // Create date with UTC adjustment to prevent timezone shifting
      const date = new Date(dateStr + 'T12:00:00Z'); // Add time and Z to ensure UTC interpretation
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC' // Ensure date is interpreted in UTC
      });
    } catch {
      return dateStr;
    }
  };
  
  return (
    <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-lg text-[10px] sm:text-xs">
      <p className="font-medium mb-1">{formatDate(label)}</p>
      {payload.map((entry) => (
        <div 
          key={entry.name} 
          className="flex items-center gap-2"
        >
          <div 
            className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.name}:</span>
          <span className="font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export function ActivityAreaChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [windowWidth, setWindowWidth] = useState<number>(0)

  // Detectar largura da janela para responsividade
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Definir largura inicial
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  useEffect(() => {
    const fetchActivityStats = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/activity-stats')
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar dados: ${response.status}`)
        }
        
        const result = await response.json()
        console.log('Activity stats data:', result)
        
        if (result.chartData && Array.isArray(result.chartData)) {
          setData(result.chartData)
        } else {
          setError('Formato de dados inválido')
        }
      } catch (error) {
        console.error('Error fetching activity stats:', error)
        setError(error instanceof Error ? error.message : 'Erro desconhecido')
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivityStats()
  }, [])

  const formatDate = (dateStr: string) => {
    try {
      // Create date with UTC adjustment to prevent timezone shifting
      const date = new Date(dateStr + 'T12:00:00Z') // Add time and Z to ensure UTC interpretation
      // Formato DD/MM
      return `${date.getUTCDate().toString().padStart(2, '0')}/${(date.getUTCMonth() + 1).toString().padStart(2, '0')}`
    } catch {
      return dateStr
    }
  }

  // Determinar intervalo de ticks para eixo X baseado na largura da tela
  const xAxisInterval = useMemo(() => {
    if (windowWidth < 640) return 4;  // Mobile
    if (windowWidth < 1024) return 2; // Tablet
    return 1;                         // Desktop
  }, [windowWidth]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || data.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
        <p className="text-xs sm:text-sm font-medium">{error || "Nenhum dado disponível"}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-[10px] sm:text-xs text-primary hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  // Transformar os dados para exibição de legendas corretas
  const transformedData = data.map(item => ({
    ...item,
    "Tarefas Criadas": item.TarefasCriadas,
    "Atualizações de Status": item.AtualizacoesStatus
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={transformedData}
        margin={{
          top: 10,
          right: 30,
          left: 15,
          bottom: 30,
        }}
      >
        <defs>
          <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="colorUpdated" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          tick={{ fontSize: 11, fill: '#4b5563' }}
          tickMargin={10}
          height={35}
          interval={xAxisInterval}
          allowDataOverflow={false}
          padding={{ right: 10 }}
          label={{ 
            value: 'Data', 
            position: 'insideBottom', 
            offset: -10,
            fontSize: 12,
            fill: '#4b5563',
            fontWeight: 500
          }}
        />
        <YAxis 
          tick={{ fontSize: 11, fill: '#4b5563' }}
          tickMargin={8}
          width={40}
          tickFormatter={(value) => value.toString()}
          label={{ 
            value: 'Quantidade', 
            angle: -90, 
            position: 'insideLeft',
            offset: 5,
            fontSize: 12,
            fill: '#4b5563',
            fontWeight: 500
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="bottom"
          wrapperStyle={{
            paddingTop: "20px",
            fontSize: "10px",
            marginTop: "10px"
          }}
          iconSize={8}
          iconType="circle"
          formatter={(value: string): ReactNode => (
            <span className="text-[8px] sm:text-[10px] md:text-xs">{value}</span>
          )}
        />
        <Area
          type="monotone"
          dataKey="Tarefas Criadas"
          stroke="#22c55e"
          strokeWidth={1.5}
          fillOpacity={1}
          fill="url(#colorCreated)"
          activeDot={{ r: 4 }}
          animationDuration={800}
          animationEasing="ease-out"
        />
        <Area
          type="monotone"
          dataKey="Atualizações de Status"
          stroke="#3b82f6"
          strokeWidth={1.5}
          fillOpacity={1}
          fill="url(#colorUpdated)"
          activeDot={{ r: 4 }}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
} 