import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface TaskCardProps {
  user: string
  email: string
  taskId: string
  title: string
  description: string
  system: string
  status: string
  priority: "Alta" | "Média" | "Baixa"
  estimate: string
  startDate: string
  endDate: string
}

export function TaskCard({
  user,
  email,
  title,
  description,
  system,
  status,
  priority,
  estimate,
  startDate,
  endDate,
}: TaskCardProps) {
  const priorityColor = {
    Alta: "bg-red-500",
    Média: "bg-yellow-500",
    Baixa: "bg-green-500",
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarImage email={email} />
          <AvatarFallback>{user[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{user}</h3>
          <Badge variant="outline">
            {system || `Projeto ${system}`}
          </Badge>
        </div>
        <Badge className={`ml-auto ${priorityColor[priority]}`}>{priority}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">{title}</h4>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Status</p>
              <p>{status}</p>
            </div>
            <div>
              <p className="text-gray-500">Estimativa</p>
              <p>{estimate}</p>
            </div>
            <div>
              <p className="text-gray-500">Início</p>
              <p>{startDate}</p>
            </div>
            <div>
              <p className="text-gray-500">Fim</p>
              <p>{endDate}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

