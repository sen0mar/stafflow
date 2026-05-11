import { Edit3, MoreHorizontal, Trash2 } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { formatDate } from '@/shared/lib/dates'
import type { Department } from '../api/departments.api'

interface DepartmentsTableProps {
  canManage: boolean
  departments: Department[]
  onDelete: (department: Department) => void
  onEdit: (department: Department) => void
}

export const DepartmentsTable = ({
  canManage,
  departments,
  onDelete,
  onEdit,
}: DepartmentsTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Description</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Employees</TableHead>
        <TableHead>Updated</TableHead>
        {canManage ? <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead> : null}
      </TableRow>
    </TableHeader>
    <TableBody>
      {departments.map((department) => (
        <TableRow key={department.id}>
          <TableCell className="font-medium text-primary">{department.name}</TableCell>
          <TableCell className="max-w-[28rem] truncate text-muted">
            {department.description || 'No description'}
          </TableCell>
          <TableCell>
            <Badge variant={department.isActive ? 'secondary' : 'outline'}>
              {department.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </TableCell>
          <TableCell>{department.employeeCount}</TableCell>
          <TableCell>{formatDate(department.updatedAt, 'MMM d, yyyy')}</TableCell>
          {canManage ? (
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Open actions for ${department.name}`}>
                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onEdit(department)}>
                    <Edit3 className="h-4 w-4" aria-hidden="true" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onSelect={() => onDelete(department)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          ) : null}
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
