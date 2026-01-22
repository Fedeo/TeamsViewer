'use client';

import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import type { Resource, Team, Assignment } from '@/domain/types';
import styles from './AssignmentDialog.module.css';

interface AssignmentDialogProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onConfirm: (start: string, end: string, isTeamLeader: boolean, role?: string) => void;
  resource: Resource | undefined;
  team: Team | undefined;
  existingAssignment?: Assignment | null;
  validationError?: string | null;
}

export function AssignmentDialog({
  isOpen,
  mode,
  onClose,
  onConfirm,
  resource,
  team,
  existingAssignment,
  validationError,
}: AssignmentDialogProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [role, setRole] = useState('');
  const [isTeamLeader, setIsTeamLeader] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && existingAssignment) {
        // Pre-fill with existing assignment values
        setStartDate(format(new Date(existingAssignment.start), 'yyyy-MM-dd'));
        setEndDate(format(new Date(existingAssignment.end), 'yyyy-MM-dd'));
        setRole(existingAssignment.role || '');
        setIsTeamLeader(existingAssignment.isTeamLeader || false);
      } else {
        // Default values for new assignment
        const today = new Date();
        setStartDate(format(today, 'yyyy-MM-dd'));
        setEndDate(format(addDays(today, 14), 'yyyy-MM-dd'));
        setRole('');
        setIsTeamLeader(false);
      }
    }
  }, [isOpen, mode, existingAssignment]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startISO = new Date(startDate).toISOString();
    const endISO = new Date(endDate).toISOString();
    onConfirm(startISO, endISO, isTeamLeader, role || undefined);
  };

  const isValid = startDate && endDate && new Date(startDate) < new Date(endDate);

  const isEditMode = mode === 'edit';
  const title = isEditMode ? 'Edit Assignment' : 'Create Assignment';
  const submitText = isEditMode ? 'Save Changes' : 'Create Assignment';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="dialog-title"
        aria-modal="true"
      >
        <div className={styles.header}>
          <h2 id="dialog-title">{title}</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.preview}>
          <div className={styles.previewResource}>
            <span className={styles.previewLabel}>Technician</span>
            <span className={styles.previewValue}>{resource ? `${resource.name} ${resource.surname}` : 'Unknown'}</span>
          </div>
          <div className={styles.previewArrow}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <div className={styles.previewTeam}>
            <div
              className={styles.previewTeamColor}
              style={{ background: team?.color || '#71717a' }}
            />
            <div>
              <span className={styles.previewLabel}>Team</span>
              <span className={styles.previewValue}>{team?.name || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {validationError && (
          <div className={styles.errorBanner}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.dateFields}>
            <div className={styles.field}>
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="role">Role (optional)</label>
            <input
              type="text"
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Lead, Support, Consultant"
            />
          </div>

          <div className={styles.checkboxField}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isTeamLeader}
                onChange={(e) => setIsTeamLeader(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </span>
              <span className={styles.checkboxText}>
                <strong>Team Leader</strong>
                <small>This person will lead the team during this period</small>
              </span>
            </label>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.confirmButton} disabled={!isValid}>
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
