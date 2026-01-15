/**
 * DataTable Example Page
 *
 * Demonstrates the framework's DataTable component with sorting, filtering,
 * pagination, and column configuration.
 */

import { useState, useMemo } from 'react';
import { Card, Button, Badge, DataTable } from '@superdangerous/app-framework/ui';
import type { ColumnDef } from '@superdangerous/app-framework/ui';
import { Table2, RefreshCw, Download } from 'lucide-react';

// Demo data types
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  lastLogin: string;
  department: string;
}

// Generate demo users
function generateDemoUsers(): User[] {
  const roles: User['role'][] = ['admin', 'editor', 'viewer'];
  const statuses: User['status'][] = ['active', 'inactive', 'pending'];
  const departments = ['Engineering', 'Marketing', 'Sales', 'Support', 'HR', 'Finance'];
  const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Wilson', 'Moore'];

  return Array.from({ length: 50 }, (_, i) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const createdDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    const lastLoginDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

    return {
      id: `user-${i + 1}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      role: roles[Math.floor(Math.random() * roles.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: createdDate.toISOString(),
      lastLogin: lastLoginDate.toISOString(),
      department: departments[Math.floor(Math.random() * departments.length)],
    };
  });
}

// Status badge component
function StatusBadge({ status }: { status: User['status'] }) {
  const variants: Record<User['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    inactive: 'secondary',
    pending: 'outline',
  };
  const colors: Record<User['status'], string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  };

  return (
    <Badge variant={variants[status]} className={colors[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// Role badge component
function RoleBadge({ role }: { role: User['role'] }) {
  const colors: Record<User['role'], string> = {
    admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    editor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    viewer: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  };

  return (
    <Badge variant="outline" className={colors[role]}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  );
}

export function DataTableExamplePage() {
  const [users] = useState<User[]>(() => generateDemoUsers());
  const [refreshKey, setRefreshKey] = useState(0);

  // Define columns with proper typing
  const columns: ColumnDef<User>[] = useMemo(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessorKey: 'name',
        enableSorting: true,
        cell: ({ row }) => (
          <div className="font-medium">{row.original.name}</div>
        ),
      },
      {
        id: 'email',
        header: 'Email',
        accessorKey: 'email',
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        id: 'department',
        header: 'Department',
        accessorKey: 'department',
        enableSorting: true,
      },
      {
        id: 'role',
        header: 'Role',
        accessorKey: 'role',
        enableSorting: true,
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        enableSorting: true,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'lastLogin',
        header: 'Last Login',
        accessorKey: 'lastLogin',
        enableSorting: true,
        cell: ({ row }) => {
          const date = new Date(row.original.lastLogin);
          return (
            <span className="text-muted-foreground text-sm">
              {date.toLocaleDateString()}
            </span>
          );
        },
      },
    ],
    []
  );

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleExport = () => {
    const csv = [
      ['Name', 'Email', 'Department', 'Role', 'Status', 'Last Login'],
      ...users.map((u) => [
        u.name,
        u.email,
        u.department,
        u.role,
        u.status,
        new Date(u.lastLogin).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-500/10">
              <Table2 className="h-6 w-6 text-pink-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">DataTable Example</h1>
              <p className="text-muted-foreground">
                Demonstrates sorting, filtering, and pagination
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Features Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-medium mb-2">Sorting</h3>
            <p className="text-sm text-muted-foreground">
              Click column headers to sort ascending or descending
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-medium mb-2">Filtering</h3>
            <p className="text-sm text-muted-foreground">
              Use the search box to filter across all columns
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-medium mb-2">Pagination</h3>
            <p className="text-sm text-muted-foreground">
              Navigate through large datasets with page controls
            </p>
          </div>
        </div>
      </Card>

      {/* DataTable */}
      <Card className="p-6">
        <DataTable
          key={refreshKey}
          data={users}
          columns={columns}
          filterPlaceholder="Search users..."
          emptyMessage="No users found"
          showPagination={true}
          defaultPageSize={10}
        />
      </Card>

      {/* Code Example */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Usage Example</h2>
        <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
          <code>{`import { DataTable } from '@superdangerous/app-framework/ui';
import type { ColumnDef } from '@superdangerous/app-framework/ui';

const columns: ColumnDef<User>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
    enableSorting: true,
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => <Badge>{row.original.status}</Badge>,
  },
];

<DataTable
  data={users}
  columns={columns}
  filterPlaceholder="Search..."
  showPagination={true}
  defaultPageSize={10}
/>`}</code>
        </pre>
      </Card>
    </div>
  );
}
