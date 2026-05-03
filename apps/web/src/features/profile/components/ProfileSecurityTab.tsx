import type { FormEvent } from 'react';
import { inputCls, labelCls } from '@/lib/constants/form-styles';

interface ProfileSecurityTabProps {
  currentPassword: string;
  newPassword: string;
  message: string;
  isPending: boolean;
  deleteConfirm: boolean;
  setCurrentPassword: (value: string) => void;
  setNewPassword: (value: string) => void;
  setDeleteConfirm: (value: boolean) => void;
  onSubmit: (e: FormEvent) => void;
  labels: {
    title: string;
    currentPassword: string;
    newPassword: string;
    changePassword: string;
    deleteAccount: string;
    deleteConfirm: string;
    confirmDelete: string;
    cancel: string;
  };
}

export function ProfileSecurityTab({
  currentPassword,
  newPassword,
  message,
  isPending,
  deleteConfirm,
  setCurrentPassword,
  setNewPassword,
  setDeleteConfirm,
  onSubmit,
  labels,
}: ProfileSecurityTabProps) {
  return (
    <div className="p-4 space-y-3">
      <form onSubmit={onSubmit} className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 space-y-4">
        <h2 className="text-[15px] font-bold text-on-surface">{labels.title}</h2>
        <div>
          <label className={labelCls}>{labels.currentPassword}</label>
          <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{labels.newPassword}</label>
          <input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} />
        </div>
        {message && <p className="text-[12px] text-brand-green font-medium">{message}</p>}
        <button type="submit" disabled={isPending} className="w-full h-10 rounded-xl bg-primary text-on-primary text-[13px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5">
          {isPending && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
          {labels.changePassword}
        </button>
      </form>

      <div className="rounded-2xl border border-error/20 bg-surface-container-lowest p-4">
        {!deleteConfirm ? (
          <button type="button" onClick={() => setDeleteConfirm(true)} className="w-full h-10 rounded-xl text-[13px] text-error font-medium hover:bg-error/5 transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base">person_remove</span>
            {labels.deleteAccount}
          </button>
        ) : (
          <div className="bg-error/5 rounded-xl p-3 space-y-2">
            <p className="text-[12px] text-error font-medium text-center">{labels.deleteConfirm}</p>
            <div className="flex gap-2">
              <button type="button" className="flex-1 h-9 rounded-xl bg-error text-white text-[12px] font-medium hover:bg-error/90 transition-colors">
                {labels.confirmDelete}
              </button>
              <button type="button" onClick={() => setDeleteConfirm(false)} className="flex-1 h-9 rounded-xl border border-outline-variant/30 text-[12px] text-on-surface-variant hover:bg-surface-container transition-colors">
                {labels.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
