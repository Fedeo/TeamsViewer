'use client';

import { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Resource } from '@/domain/types';
import styles from './ResourcePanel.module.css';

interface ResourcePanelProps {
  resources: Resource[];
  isLoading?: boolean;
}

export function ResourcePanel({ resources, isLoading }: ResourcePanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResources = useMemo(() => {
    if (!searchQuery.trim()) {
      return resources;
    }
    const query = searchQuery.toLowerCase();
    return resources.filter((resource) => {
      const fullName = `${resource.name} ${resource.surname}`.toLowerCase();
      const role = resource.role.toLowerCase();
      const skills = resource.skills.join(' ').toLowerCase();
      return fullName.includes(query) || role.includes(query) || skills.includes(query);
    });
  }, [resources, searchQuery]);

  if (isLoading) {
    return (
      <aside className={styles.panel}>
        <div className={styles.header}>
          <h2>Technicians</h2>
          <span className={styles.count}>—</span>
        </div>
        <div className={styles.loading}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={styles.skeleton} style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </aside>
    );
  }

  const showingFiltered = searchQuery.trim() && filteredResources.length !== resources.length;

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h2>Technicians</h2>
        <span className={styles.count}>
          {showingFiltered ? `${filteredResources.length}/${resources.length}` : resources.length}
        </span>
      </div>
      
      <div className={styles.searchWrapper}>
        <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, role, skill..."
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className={styles.clearButton}
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className={styles.list}>
        {filteredResources.length === 0 ? (
          <div className={styles.emptyState}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
              <path d="M8 11h6" />
            </svg>
            <span>No technicians found</span>
            <button className={styles.clearSearch} onClick={() => setSearchQuery('')}>
              Clear search
            </button>
          </div>
        ) : (
          filteredResources.map((resource, index) => (
            <DraggableResource key={resource.id} resource={resource} index={index} />
          ))
        )}
      </div>
    </aside>
  );
}

interface DraggableResourceProps {
  resource: Resource;
  index: number;
}

function DraggableResource({ resource, index }: DraggableResourceProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `resource-${resource.id}`,
    data: {
      type: 'resource',
      resource,
    },
  });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: isDragging ? 1000 : undefined,
      }
    : undefined;

  const initials = `${resource.name[0]}${resource.surname[0]}`.toUpperCase();

  const roleColors: Record<string, string> = {
    'Technician': '#3b82f6',
    'Senior Technician': '#8b5cf6',
    'Lead Technician': '#f59e0b',
    'Engineer': '#10b981',
    'Manager': '#ef4444',
  };

  const roleColor = roleColors[resource.role] || '#71717a';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`${styles.resourceCard} ${isDragging ? styles.dragging : ''}`}
    >
      <div className={styles.avatar} style={{ background: `${roleColor}20`, color: roleColor }}>
        {initials}
      </div>
      <div className={styles.info}>
        <span className={styles.name}>{resource.name} {resource.surname}</span>
        <span className={styles.role} style={{ color: roleColor }}>
          {resource.role}
        </span>
      </div>
      <div className={styles.dragHandle}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </div>
    </div>
  );
}
