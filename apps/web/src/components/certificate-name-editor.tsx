import { useState } from 'react';
import { AlertTriangle, Check, Lock, X } from 'lucide-react';
import { toast } from 'sonner';

import { validateCertificateName } from '@base/core/utils/certificate-name';
import { Button } from '@base/ui/components/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@base/ui/components/dialog';
import { Input } from '@base/ui/components/input';

type CertificateNameEditorProps = {
  currentName: string;
  onSave: (name: string) => Promise<void>;
  isSaving: boolean;
  isLocked: boolean;
};

export function CertificateNameEditor({ currentName, onSave, isSaving, isLocked }: CertificateNameEditorProps) {
  const [editedName, setEditedName] = useState(currentName);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingName, setPendingName] = useState<string>('');

  const handleSaveClick = () => {
    if (isLocked) return;

    const trimmed = editedName.trim();
    const validation = validateCertificateName(trimmed);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid name');
      return;
    }

    setPendingName(trimmed);
    setTimeout(() => {
      setShowConfirmDialog(true);
    }, 0);
  };

  const handleConfirmSave = async () => {
    setShowConfirmDialog(false);
    await onSave(pendingName);
  };

  const handleCancelSave = () => {
    setShowConfirmDialog(false);
    setPendingName('');
  };

  if (isLocked) {
    return (
      <div className="flex w-full max-w-md flex-col gap-3">
        <label className="text-sm font-medium text-gray-700">Certificate Name</label>
        <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
          <Lock className="h-4 w-4 text-gray-400" />
          <span className="flex-1 text-sm text-gray-900">{currentName}</span>
        </div>
        <p className="text-xs text-gray-500">Certificate name has been saved and cannot be changed</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex w-full max-w-md flex-col gap-3">
        <label className="text-sm font-medium text-gray-700">Certificate Name</label>
        <div className="flex gap-2">
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleSaveClick();
              }
            }}
            disabled={isSaving}
            maxLength={100}
            className="flex-1"
          />
          <Button type="button" onClick={handleSaveClick} disabled={isSaving}>
            <Check className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
        <p className="text-xs text-gray-500">This name will appear on your certificate</p>
      </div>

      <Dialog
        open={showConfirmDialog}
        onOpenChange={(open) => {
          if (!open && isSaving) {
            return;
          }
          if (!open && !pendingName) {
            return;
          }
          setShowConfirmDialog(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Certificate Name
            </DialogTitle>
            <DialogDescription className="pt-2">
              You are about to save your certificate name. Once saved, you will not be able to change it again.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="mb-1 text-sm font-medium text-gray-700">Your certificate will display:</p>
              <p className="text-lg font-semibold text-gray-900">{pendingName}</p>
            </div>
            <p className="mt-4 text-sm text-amber-600">
              <AlertTriangle className="mr-1 inline h-4 w-4" />
              This action cannot be undone. Make sure this is the name you want on your certificate.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancelSave} disabled={isSaving}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleConfirmSave} disabled={isSaving}>
              <Check className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Confirm & Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
