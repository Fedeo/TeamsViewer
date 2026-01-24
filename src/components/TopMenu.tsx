'use client';

import { format } from 'date-fns';
import { useUIStore, ZOOM_LEVELS } from '@/lib/store/ui-store';
import styles from './TopMenu.module.css';

export function TopMenu() {
  const { 
    viewRange, 
    navigateWeeks, 
    zoomIndex, 
    zoomIn, 
    zoomOut, 
    resetZoom,
    hasUnsavedChanges,
    isSyncing,
    hasValidationWarnings,
    startSync,
    finishSync,
  } = useUIStore();

  const canZoomIn = zoomIndex < ZOOM_LEVELS.length - 1;
  const canZoomOut = zoomIndex > 0;
  const zoomPercent = Math.round((ZOOM_LEVELS[zoomIndex] / 48) * 100);

  const canPush = hasUnsavedChanges && !isSyncing && !hasValidationWarnings;

  const handlePushToCloud = async () => {
    if (!canPush) return;
    
    startSync();
    
    // TODO: Implement actual IFS Cloud sync
    // For now, simulate a network request
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    finishSync();
  };

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 10h18" />
            <path d="M9 4v16" />
          </svg>
        </div>
        <div className={styles.brandText}>
          <h1>TeamsViewer</h1>
          <span>Crews Scheduler</span>
        </div>
      </div>

      <nav className={styles.navigation}>
        <button className={styles.navButton} onClick={() => navigateWeeks('prev')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        
        <div className={styles.dateRange}>
          <span className={styles.dateLabel}>Viewing</span>
          <span className={styles.dates}>
            {format(viewRange.start, 'MMM d')} — {format(viewRange.end, 'MMM d, yyyy')}
          </span>
        </div>

        <button className={styles.navButton} onClick={() => navigateWeeks('next')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </nav>

      <div className={styles.actions}>
        {/* Zoom Controls */}
        <div className={styles.zoomControls}>
          <button 
            className={styles.zoomButton} 
            onClick={zoomOut}
            disabled={!canZoomOut}
            title="Zoom out"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
              <path d="M8 11h6" />
            </svg>
          </button>
          
          <button 
            className={styles.zoomLevel} 
            onClick={resetZoom}
            title="Reset zoom to 100%"
          >
            {zoomPercent}%
          </button>
          
          <button 
            className={styles.zoomButton} 
            onClick={zoomIn}
            disabled={!canZoomIn}
            title="Zoom in"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
              <path d="M11 8v6M8 11h6" />
            </svg>
          </button>
        </div>

        <div className={styles.divider} />

        <button className={styles.todayButton} onClick={() => useUIStore.getState().setViewRange({
          start: new Date(),
          end: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
        })}>
          Today
        </button>

        <div className={styles.divider} />

        {/* Push to IFS Cloud Button */}
        <button 
          className={`${styles.pushButton} ${canPush ? styles.hasChanges : ''} ${isSyncing ? styles.syncing : ''} ${hasValidationWarnings ? styles.hasWarnings : ''}`}
          onClick={handlePushToCloud}
          disabled={!canPush}
          title={
            hasValidationWarnings 
              ? 'Cannot push: Fix team leader warnings first' 
              : hasUnsavedChanges 
                ? 'Push changes to IFS Cloud' 
                : 'No changes to push'
          }
        >
          {isSyncing ? (
            <>
              <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19V5M5 12l7-7 7 7" />
                <path d="M5 19h14" />
              </svg>
              <span>Push to IFS Cloud</span>
              {hasUnsavedChanges && <span className={styles.changeBadge} />}
            </>
          )}
        </button>
      </div>
    </header>
  );
}
