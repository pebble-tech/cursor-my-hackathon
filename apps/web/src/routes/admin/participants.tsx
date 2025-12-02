import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { type ColumnDef } from '@tanstack/react-table';
import { AlertCircle, CheckCircle2, Download, Loader2, Mail, Plus, Search, Upload } from 'lucide-react';

import { Button } from '@base/ui/components/button';
import { DataTable } from '@base/ui/components/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@base/ui/components/dialog';
import { FileUpload } from '@base/ui/components/file-upload';
import { Input } from '@base/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@base/ui/components/select';

import {
  createUser,
  importParticipants,
  listParticipants,
  type CreateUserInput,
  type ListParticipantsInput,
} from '~/apis/admin/participants';
import { generateSkippedRowsCSV, parseParticipantsCSV, type ParsedRow } from '~/utils/csv-parser';

export const Route = createFileRoute('/admin/participants')({
  component: ParticipantsPage,
});

type Participant = {
  id: string;
  name: string;
  email: string;
  role: string;
  participantType: string;
  status: string;
  createdAt: Date;
  checkedInAt: Date | null;
};

const columns: ColumnDef<Participant>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.getValue('role') as string;
      const styles: Record<string, string> = {
        admin: 'bg-purple-100 text-purple-800',
        ops: 'bg-blue-100 text-blue-800',
        participant: 'bg-gray-100 text-gray-800',
      };
      return (
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[role] || styles.participant}`}>
          {role}
        </span>
      );
    },
  },
  {
    accessorKey: 'participantType',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('participantType') as string;
      const styles: Record<string, string> = {
        vip: 'bg-yellow-100 text-yellow-800',
        regular: 'bg-gray-100 text-gray-800',
      };
      return (
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[type] || styles.regular}`}>{type}</span>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const styles: Record<string, string> = {
        checked_in: 'bg-green-100 text-green-800',
        registered: 'bg-gray-100 text-gray-800',
      };
      const labels: Record<string, string> = {
        checked_in: 'Checked In',
        registered: 'Registered',
      };
      return (
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status] || styles.registered}`}>
          {labels[status] || status}
        </span>
      );
    },
  },
];

function ParticipantsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserType, setNewUserType] = useState<'vip' | 'ops' | 'admin'>('vip');

  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: Array<{ row: number; email: string; reason: string }>;
  } | null>(null);

  const listParams: ListParticipantsInput = {
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    search: search || undefined,
    status: statusFilter !== 'all' ? (statusFilter as 'registered' | 'checked_in') : undefined,
    participantType: typeFilter !== 'all' ? (typeFilter as 'regular' | 'vip') : undefined,
    role: roleFilter !== 'all' ? (roleFilter as 'participant' | 'ops' | 'admin') : undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  const { data, isLoading } = useQuery({
    queryKey: ['participants', listParams],
    queryFn: () => listParticipants({ data: listParams }),
  });

  const createUserMutation = useMutation({
    mutationFn: (input: CreateUserInput) => createUser({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
      setAddUserDialogOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserType('vip');
    },
  });

  const importMutation = useMutation({
    mutationFn: (participants: Array<{ name: string; email: string; lumaId?: string }>) =>
      importParticipants({ data: { participants } }),
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['participants'] });
    },
  });

  const handleFileSelect = async (file: File) => {
    setCsvFile(file);
    setParseError(null);
    setParsedRows([]);
    setImportResult(null);

    const content = await file.text();
    const result = parseParticipantsCSV(content);

    if (!result.success) {
      setParseError(result.error || 'Failed to parse CSV');
      return;
    }

    setParsedRows(result.rows);
  };

  const handleImport = () => {
    const validParticipants = parsedRows.filter((r) => r.valid).map((r) => r.data);

    if (validParticipants.length === 0) {
      setParseError('No valid rows to import');
      return;
    }

    importMutation.mutate(validParticipants);
  };

  const handleDownloadSkipped = () => {
    if (!importResult?.skipped.length) return;

    const csv = generateSkippedRowsCSV(importResult.skipped);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skipped-rows.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddUser = () => {
    if (!newUserName || !newUserEmail) return;
    createUserMutation.mutate({
      name: newUserName,
      email: newUserEmail,
      userType: newUserType,
    });
  };

  const resetImportDialog = () => {
    setCsvFile(null);
    setParsedRows([]);
    setParseError(null);
    setImportResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Participants</h1>
          <p className="mt-1 text-sm text-gray-500">Manage registrations, imports, and participant details</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Mail className="h-4 w-4" />
            Send Invites
          </Button>

          <Dialog
            open={importDialogOpen}
            onOpenChange={(open) => {
              setImportDialogOpen(open);
              if (!open) resetImportDialog();
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Participants</DialogTitle>
                <DialogDescription>Upload a CSV file with columns: name, email, luma_id (optional)</DialogDescription>
              </DialogHeader>

              {importResult ? (
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">
                        Successfully imported {importResult.imported} participants
                      </p>
                      {importResult.skipped.length > 0 && (
                        <p className="text-sm text-green-700">{importResult.skipped.length} rows skipped</p>
                      )}
                    </div>
                  </div>

                  {importResult.skipped.length > 0 && (
                    <Button variant="outline" onClick={handleDownloadSkipped} className="gap-2">
                      <Download className="h-4 w-4" />
                      Download Skipped Rows
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    value={csvFile}
                    onClear={() => {
                      setCsvFile(null);
                      setParsedRows([]);
                      setParseError(null);
                    }}
                    error={parseError}
                    loading={importMutation.isPending}
                  />

                  {parsedRows.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {parsedRows.filter((r) => r.valid).length} valid rows,{' '}
                          {parsedRows.filter((r) => !r.valid).length} invalid
                        </span>
                        <span className="text-gray-500">
                          Showing first {Math.min(5, parsedRows.length)} of {parsedRows.length}
                        </span>
                      </div>

                      <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">Row</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">Email</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedRows.slice(0, 5).map((row) => (
                              <tr key={row.row} className="border-t">
                                <td className="px-3 py-2 text-gray-500">{row.row}</td>
                                <td className="px-3 py-2">{row.data.name}</td>
                                <td className="px-3 py-2">{row.data.email}</td>
                                <td className="px-3 py-2">
                                  {row.valid ? (
                                    <span className="text-green-600">Valid</span>
                                  ) : (
                                    <span className="text-red-600">{row.error}</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      onClick={handleImport}
                      disabled={parsedRows.filter((r) => r.valid).length === 0 || importMutation.isPending}
                    >
                      {importMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        `Import ${parsedRows.filter((r) => r.valid).length} Participants`
                      )}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add User</DialogTitle>
                <DialogDescription>Manually create a new VIP, ops, or admin account.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input placeholder="John Doe" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">User Type</label>
                  <Select value={newUserType} onValueChange={(v) => setNewUserType(v as 'vip' | 'ops' | 'admin')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vip">VIP (Cannot login, QR only)</SelectItem>
                      <SelectItem value="ops">Ops (Magic link login)</SelectItem>
                      <SelectItem value="admin">Admin (Google OAuth login)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {createUserMutation.isError && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    {(createUserMutation.error as Error).message}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  onClick={handleAddUser}
                  disabled={!newUserName || !newUserEmail || createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-72">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            placeholder="Search by name or email..."
            className="pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="registered">Registered</SelectItem>
              <SelectItem value="checked_in">Checked In</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="participant">Participant</SelectItem>
              <SelectItem value="ops">Ops</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <DataTable
          columns={columns}
          data={data?.users ?? []}
          pageCount={data?.pagination.totalPages ?? 0}
          pagination={pagination}
          onPaginationChange={setPagination}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
