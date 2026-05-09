import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { createWorld, deleteWorld, listWorlds, type WorldSummary } from '../../api/worlds';
import styles from './WorldsListPage.module.css';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

export const WorldsListPage: React.FC = () => {
  const { user, isReady } = useAuth();
  const navigate = useNavigate();
  const [worlds, setWorlds] = useState<WorldSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isReady) return;
    if (!user) { setLoading(false); return; }

    listWorlds()
      .then(setWorlds)
      .catch(() => setError('Could not load your worlds.'))
      .finally(() => setLoading(false));
  }, [isReady, user]);

  async function handleCreate() {
    if (!user) { navigate('/auth'); return; }
    setCreating(true);
    try {
      const world = await createWorld();
      navigate(`/sandbox/${world.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create world. Please try again.';
      setError(message);
      setCreating(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm('Delete this world? This cannot be undone.')) return;
    try {
      await deleteWorld(id);
      setWorlds((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete world.';
      setError(message);
    }
  }

  if (!isReady || loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading worlds…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.unauthenticated}>
          <p className={styles.unauthMsg}>Sign in to create and manage your sandbox worlds.</p>
          <button className={styles.signInBtn} onClick={() => navigate('/auth')}>
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Sandbox</h1>
          <p className={styles.sub}>Your network worlds</p>
        </div>
      </header>

      {error && <p className={styles.errorBanner}>{error}</p>}

      {worlds.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>⬡</div>
          <p className={styles.emptyTitle}>No worlds yet</p>
          <p className={styles.emptyDesc}>Create your first sandbox world</p>
          <button className={styles.createBtnLarge} onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating…' : '+ Create World'}
          </button>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {worlds.map((world) => (
              <div
                key={world.id}
                className={styles.card}
                onClick={() => navigate(`/sandbox/${world.id}`)}
              >
                <div className={styles.thumb}>
                  {world.thumbnailData ? (
                    <img src={world.thumbnailData} alt={world.title} className={styles.thumbImg} />
                  ) : (
                    <div className={styles.thumbEmpty}>
                      <span className={styles.thumbIcon}>⬡</span>
                    </div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardTitle}>{world.title}</div>
                  {world.description && (
                    <div className={styles.cardDesc}>{world.description}</div>
                  )}
                  <div className={styles.cardMeta}>
                    <span className={styles.cardUser}>by {user.name}</span>
                    <span className={styles.cardTime}>{timeAgo(world.updatedAt)}</span>
                  </div>
                </div>

                <button
                  className={styles.deleteBtn}
                  onClick={(e) => handleDelete(e, world.id)}
                  title="Delete world"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button className={styles.fabCreateBtn} onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating...' : '+'}
          </button>
        </>
      )}
    </div>
  );
};
