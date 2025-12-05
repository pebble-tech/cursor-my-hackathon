import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Check, Copy, ExternalLink, LogOut } from 'lucide-react';
import { toast } from 'sonner';

import { ParticipantStatusEnum } from '@base/core/config/constant';
import { Button } from '@base/ui/components/button';

import { QRCodeDisplay } from '~/components/qr-code-display';
import { getServerSession } from '~/apis/auth';
import { getParticipantDashboard, markCreditRedeemed } from '~/apis/participant/dashboard';
import { authClient } from '~/utils/auth-client';
import { categoryIcons } from '~/utils/credit-category-icons';

export const Route = createFileRoute('/dashboard')({
  head: () => ({
    meta: [{ title: 'Dashboard - MY Hackathon' }],
  }),
  beforeLoad: async () => {
    const session = await getServerSession();
    if (!session) {
      throw redirect({ to: '/login' });
    }
    return { session };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['participant-dashboard'],
    queryFn: () => getParticipantDashboard(),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  const redeemMutation = useMutation({
    mutationFn: markCreditRedeemed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participant-dashboard'] });
      toast.success('Marked as redeemed');
    },
    onError: () => {
      toast.error('Failed to update');
    },
  });

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/';
        },
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">Failed to load dashboard</p>
      </div>
    );
  }

  const { user, credits } = data;
  const isCheckedIn = user.status === ParticipantStatusEnum.checked_in;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{user.name}</h1>
            <StatusBadge status={user.status} checkedInAt={user.checkedInAt} />
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-center text-sm font-medium text-gray-500">Your QR Code</h2>
          {user.qrCodeValue ? (
            <>
              <QRCodeDisplay value={user.qrCodeValue} size={280} />
              <div className="mt-4 space-y-1 text-center text-sm text-gray-600">
                <p>Show this at registration desk</p>
                <p>Show at food stations</p>
              </div>
              <p className="mt-3 text-center text-xs text-gray-400">This QR never expires</p>
            </>
          ) : (
            <p className="text-center text-gray-500">QR code not available</p>
          )}
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Your Credits {isCheckedIn && credits.length > 0 && `(${credits.length})`}
          </h2>

          {!isCheckedIn ? (
            <div className="rounded-lg bg-gray-50 p-6 text-center">
              <p className="text-gray-600">Your credits will appear after check-in</p>
            </div>
          ) : credits.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-6 text-center">
              <p className="text-gray-600">No credits available</p>
            </div>
          ) : (
            <CreditsSection
              credits={credits}
              onMarkRedeemed={(codeId, redeemed) => redeemMutation.mutate({ data: { codeId, redeemed } })}
            />
          )}
        </section>
      </main>
    </div>
  );
}

function StatusBadge({ status, checkedInAt }: { status: string; checkedInAt?: Date | null }) {
  const isCheckedIn = status === ParticipantStatusEnum.checked_in;

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <span
      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        isCheckedIn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {isCheckedIn ? `Checked in${checkedInAt ? ` at ${formatTime(checkedInAt)}` : ''}` : 'Registered'}
    </span>
  );
}

type Credit = {
  id: string;
  codeValue: string;
  redeemUrl: string | null;
  redeemedAt: Date | null;
  creditType: {
    displayName: string;
    webInstructions: string | null;
    iconUrl: string | null;
    category: string | null;
  } | null;
};

type CreditsSectionProps = {
  credits: Credit[];
  onMarkRedeemed: (codeId: string, redeemed: boolean) => void;
};

type FilterType = 'all' | 'redeemed' | 'pending';

function CreditsSection({ credits, onMarkRedeemed }: CreditsSectionProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredCredits = credits.filter((credit) => {
    if (filter === 'all') return true;
    if (filter === 'redeemed') return credit.redeemedAt !== null;
    return credit.redeemedAt === null;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['all', 'pending', 'redeemed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredCredits.map((credit) => (
          <CreditCard key={credit.id} credit={credit} onMarkRedeemed={onMarkRedeemed} />
        ))}
        {filteredCredits.length === 0 && (
          <p className="py-4 text-center text-sm text-gray-500">No credits in this category</p>
        )}
      </div>
    </div>
  );
}

type CreditCardProps = {
  credit: Credit;
  onMarkRedeemed: (codeId: string, redeemed: boolean) => void;
};

function CreditCard({ credit, onMarkRedeemed }: CreditCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(credit.codeValue);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const isRedeemed = credit.redeemedAt !== null;

  const CategoryIcon =
    credit.creditType?.category && credit.creditType.category in categoryIcons
      ? categoryIcons[credit.creditType.category as keyof typeof categoryIcons]
      : null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {credit.creditType?.iconUrl ? (
              <img src={credit.creditType.iconUrl} alt="" className="h-6 w-6 object-contain" />
            ) : CategoryIcon ? (
              <CategoryIcon className="h-6 w-6 text-gray-600" />
            ) : null}
            <h3 className="font-medium text-gray-900">{credit.creditType?.displayName}</h3>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">{credit.codeValue}</code>
            <button
              onClick={handleCopy}
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              title="Copy code"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          {credit.redeemUrl && (
            <a
              href={credit.redeemUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              Redeem here <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {credit.creditType?.webInstructions && (
            <div className="mt-2">
              <button onClick={() => setExpanded(!expanded)} className="text-sm text-gray-500 hover:text-gray-700">
                {expanded ? 'Hide instructions' : 'Show instructions'}
              </button>
              {expanded && <p className="mt-2 text-sm text-gray-600">{credit.creditType.webInstructions}</p>}
            </div>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={isRedeemed}
            onChange={(e) => onMarkRedeemed(credit.id, e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
          />
          <span className="text-sm text-gray-600">Redeemed</span>
        </label>
      </div>

      {isRedeemed && credit.redeemedAt && (
        <p className="mt-2 text-xs text-gray-400">Redeemed on {new Date(credit.redeemedAt).toLocaleDateString()}</p>
      )}
    </div>
  );
}
