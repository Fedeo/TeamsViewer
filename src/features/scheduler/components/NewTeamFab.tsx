'use client';

import { useState } from 'react';
import { useCreateTeam } from '@/lib/query/hooks';
import { useUIStore } from '@/lib/store/ui-store';
import styles from './NewTeamFab.module.css';

const TEAM_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

export function NewTeamFab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamColor, setTeamColor] = useState(TEAM_COLORS[0]);
  const createTeam = useCreateTeam();
  const { markAsChanged } = useUIStore.getState();

  const handleOpenDialog = () => {
    setTeamName('');
    setTeamDescription('');
    setTeamColor(TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)]);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    await createTeam.mutateAsync({
      name: teamName.trim(),
      description: teamDescription.trim() || undefined,
      color: teamColor,
    });

    markAsChanged();
    setIsDialogOpen(false);
  };

  const isValid = teamName.trim().length > 0;

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={styles.fab}
        onClick={handleOpenDialog}
        title="Create New Team"
        aria-label="Create New Team"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* Dialog */}
      {isDialogOpen && (
        <div className={styles.overlay} onClick={handleCloseDialog}>
          <div
            className={styles.dialog}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="new-team-title"
            aria-modal="true"
          >
            <div className={styles.header}>
              <h2 id="new-team-title">Create New Team</h2>
              <button className={styles.closeButton} onClick={handleCloseDialog} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="teamName">Team Name *</label>
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g., Alpha Team"
                  autoFocus
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="teamDescription">Description (optional)</label>
                <input
                  type="text"
                  id="teamDescription"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="e.g., Field service team for north region"
                />
              </div>

              <div className={styles.field}>
                <label>Team Color</label>
                <div className={styles.colorPicker}>
                  {TEAM_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`${styles.colorOption} ${teamColor === color ? styles.selected : ''}`}
                      style={{ background: color }}
                      onClick={() => setTeamColor(color)}
                      aria-label={`Select color ${color}`}
                    >
                      {teamColor === color && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M5 12l5 5L20 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.preview}>
                <span className={styles.previewLabel}>Preview</span>
                <div className={styles.previewTeam}>
                  <div className={styles.previewColor} style={{ background: teamColor }} />
                  <span>{teamName || 'Team Name'}</span>
                </div>
              </div>

              <div className={styles.actions}>
                <button type="button" className={styles.cancelButton} onClick={handleCloseDialog}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.createButton} 
                  disabled={!isValid || createTeam.isPending}
                >
                  {createTeam.isPending ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
