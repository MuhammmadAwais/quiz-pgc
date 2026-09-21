'use client';

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  KeyRound,
  Database,
  Sparkles,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { seedSampleQuestions } from '@/lib/actions/questions';
import { clearContestHistory, resetAllData } from '@/lib/actions/settings';

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);

  const [clearHistoryModal, setClearHistoryModal] = useState(false);
  const [resetAllModal, setResetAllModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordMsg({ type: 'error', text: error.message });
      } else {
        setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      setPasswordMsg({ type: 'error', text: message });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSeedQuestions = async () => {
    setSeeding(true);
    setSeedSuccess(null);
    try {
      const res = await seedSampleQuestions();
      if (res.success) {
        setSeedSuccess(res.message);
      }
    } catch {
      setSeedSuccess('Failed to seed questions. Please try again.');
    } finally {
      setSeeding(false);
    }
  };

  const handleClearHistory = async () => {
    setActionLoading(true);
    try {
      await clearContestHistory();
      setClearHistoryModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetAll = async () => {
    setActionLoading(true);
    try {
      await resetAllData();
      setResetAllModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-obsidian p-6 md:p-10 max-w-5xl mx-auto space-y-8 transition-colors duration-200 font-sans">
      {/* Page Header */}
      <div className="flex items-start gap-3 pb-6 border-b border-border-subtle">
        <div className="w-10 h-10 rounded-lg bg-surface-carbon border border-border-medium flex items-center justify-center shrink-0">
          <SettingsIcon className="w-5 h-5 text-team-b-cyan" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-optic-white leading-tight">
            ACCOUNT &amp; CONSOLE SETTINGS
          </h1>
          <p className="text-xs text-text-muted-slate mt-0.5 font-sans">
            Manage master credentials, tournament defaults, and database maintenance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Security & Password */}
        <Card variant="carbon" className="space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-border-subtle">
            <KeyRound className="w-4 h-4 text-team-a-bright" />
            <h2 className="text-sm font-bold font-sans tracking-wider text-optic-white uppercase">
              Update Master Credentials
            </h2>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {passwordMsg && (
              <div
                className={`p-3 rounded-md text-xs font-mono flex items-center gap-2 ${
                  passwordMsg.type === 'success'
                    ? 'bg-state-success/15 border border-state-success/40 text-state-success'
                    : 'bg-state-warning-rose/15 border border-state-warning-rose/40 text-state-warning-rose'
                }`}
              >
                {passwordMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <Input
              label="New Master Password"
              type="password"
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="team-a"
              size="md"
              disabled={passwordLoading || !newPassword}
              className="w-full mt-2"
            >
              {passwordLoading ? 'Updating Password...' : 'Save New Password'}
            </Button>
          </form>
        </Card>

        {/* Database & Seeder Console */}
        <Card variant="carbon" className="space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-border-subtle">
            <Database className="w-4 h-4 text-team-b-cyan" />
            <h2 className="text-sm font-bold font-sans tracking-wider text-optic-white uppercase">
              Database Maintenance & Seeding
            </h2>
          </div>

          <div className="space-y-4">
            {seedSuccess && (
              <div className="p-3 rounded-md text-xs font-mono bg-state-success/15 border border-state-success/40 text-state-success flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{seedSuccess}</span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-surface-onyx border border-border-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans font-bold text-optic-white">
                  Sample Question Seeder
                </span>
                <Sparkles className="w-4 h-4 text-team-b-cyan" />
              </div>
              <p className="text-xs text-text-muted-slate font-sans">
                Quickly load vetted competition questions across Computer Science, Physics, and
                Mathematics into your Question Bank.
              </p>
              <Button
                variant="team-b"
                size="sm"
                onClick={handleSeedQuestions}
                disabled={seeding}
                className="w-full mt-2"
              >
                {seeding ? 'Seeding Tournament Questions...' : 'Seed Sample Questions'}
              </Button>
            </div>

            {/* Danger Zone */}
            <div className="p-4 rounded-xl bg-state-warning-rose/10 border border-state-warning-rose/30 space-y-3">
              <span className="text-xs font-sans font-bold text-state-warning-rose uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Danger Zone</span>
              </span>

              <div className="flex flex-col gap-2">
                <Button
                  variant="console"
                  size="sm"
                  onClick={() => setClearHistoryModal(true)}
                  className="w-full text-xs justify-between text-text-bright-slate hover:text-state-warning-rose hover:border-state-warning-rose/40"
                >
                  <span>Clear Contest History Ledger</span>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setResetAllModal(true)}
                  className="w-full text-xs justify-between"
                >
                  <span>Factory Reset Question Bank</span>
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Clear History Confirmation Modal */}
      <Modal
        isOpen={clearHistoryModal}
        onClose={() => setClearHistoryModal(false)}
        title="Clear Match History?"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted-slate font-sans">
            This will permanently remove all past tournament contest records and question usage
            history. Active question bank MCQs will NOT be deleted.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
            <Button
              variant="console"
              size="sm"
              onClick={() => setClearHistoryModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={actionLoading}
              onClick={handleClearHistory}
            >
              {actionLoading ? 'Clearing...' : 'Confirm Clear History'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Factory Reset Modal */}
      <Modal
        isOpen={resetAllModal}
        onClose={() => setResetAllModal(false)}
        title="Factory Reset All Tournament Data?"
      >
        <div className="space-y-4">
          <p className="text-sm text-state-warning-rose font-sans">
            Warning: This action is irreversible. All subjects, chapters, questions, and contest
            records will be completely purged from Supabase.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
            <Button
              variant="console"
              size="sm"
              onClick={() => setResetAllModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={actionLoading}
              onClick={handleResetAll}
            >
              {actionLoading ? 'Resetting...' : 'Confirm Full Reset'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
