'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { fetchData, insertData, updateData, deleteData, generateSequentialId } from '@/lib/api';
import { Gamepad2, Plus, Edit2, Trash2, Search, X } from 'lucide-react';

export default function GamePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [nameGame, setNameGame] = useState('');
  const [addedDate, setAddedDate] = useState('');
  const [editGame, setEditGame] = useState<any>(null);
  const [deleteTargetId, setDeleteTargetId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('loggedInUser');
    if (!stored) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(stored);
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadGames();
  }, [router]);

  const loadGames = async () => {
    setLoading(true);
    try {
      const data = await fetchData('Game');
      setGames(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const nextId = await generateSequentialId('Game', 'GAM_');
      const newG = {
        id_game: nextId,
        name_game: nameGame,
        added: addedDate || new Date().toISOString().split('T')[0],
      };
      await insertData('Game', newG);
      setShowAddModal(false);
      setNameGame('');
      setAddedDate('');
      loadGames();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGame) return;
    setSubmitting(true);
    try {
      await updateData('Game', editGame.id_game, {
        name_game: editGame.name_game,
        added: editGame.added,
      });
      setShowEditModal(false);
      setEditGame(null);
      loadGames();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setSubmitting(true);
    try {
      await deleteData('Game', deleteTargetId);
      setShowDeleteModal(false);
      setDeleteTargetId('');
      loadGames();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGames = games.filter((g) =>
    g.name_game.toLowerCase().includes(search.toLowerCase()) ||
    g.id_game.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-warm-bg">
      <Sidebar />

      <main className="lg:pl-64 pt-24 lg:pt-24 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pb-2 border-b border-warm-border/60">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-warm-text tracking-tight flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-warm-amber" /> Game Management
            </h1>
            <p className="text-xs sm:text-sm text-warm-muted">
              Manage all game categories and types.
            </p>
          </div>

          <button
            onClick={() => {
              setAddedDate(new Date().toISOString().split('T')[0]);
              setShowAddModal(true);
            }}
            className="py-2.5 px-4 rounded-xl bg-warm-amber hover:bg-warm-amberHover text-warm-bg font-semibold text-sm transition shadow-lg shadow-warm-amber/15 flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            <span>Add Game</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-subtle w-4 h-4" />
            <input
              type="text"
              placeholder="Search game name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-warm-card border border-warm-border text-warm-text placeholder:text-warm-subtle text-xs focus:outline-none focus:border-warm-amber"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : (
          <div className="w-full overflow-x-auto rounded-2xl border border-warm-border glass-warm shadow-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-warm-bg/60 border-b border-warm-border text-xs uppercase tracking-wider text-warm-muted">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">ID Game</th>
                  <th className="py-3.5 px-4 font-semibold">Game Name</th>
                  <th className="py-3.5 px-4 font-semibold">Date Added</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-border/40">
                {filteredGames.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-warm-muted text-sm">
                      No games found
                    </td>
                  </tr>
                ) : (
                  filteredGames.map((g) => (
                    <tr key={g.id_game} className="hover:bg-warm-cardHover/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-warm-amber text-xs">
                        {g.id_game}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-warm-text">{g.name_game}</td>
                      <td className="py-3.5 px-4 text-warm-muted text-xs">{g.added || '-'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditGame({ ...g });
                              setShowEditModal(true);
                            }}
                            className="p-1.5 rounded-lg border border-warm-border text-warm-amber hover:bg-warm-amber/10 transition"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTargetId(g.id_game);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 rounded-lg border border-warm-border text-warm-crimson hover:bg-warm-crimson/10 transition"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-warm w-full max-w-md rounded-2xl p-6 border border-warm-border shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-warm-border">
              <h3 className="font-bold text-warm-text text-lg">Add New Game</h3>
              <button onClick={() => setShowAddModal(false)} className="text-warm-subtle hover:text-warm-text">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-warm-muted block mb-1">Game Name</label>
                <input
                  type="text"
                  required
                  value={nameGame}
                  onChange={(e) => setNameGame(e.target.value)}
                  placeholder="Enter game title (e.g. Uno, Poker)"
                  className="w-full py-2.5 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-sm focus:outline-none focus:border-warm-amber"
                />
              </div>
              <div>
                <label className="text-xs text-warm-muted block mb-1">Date Added</label>
                <input
                  type="date"
                  value={addedDate}
                  onChange={(e) => setAddedDate(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-sm focus:outline-none focus:border-warm-amber"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-warm-border text-warm-text hover:bg-warm-border/50 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-warm-amber text-warm-bg font-semibold text-sm hover:bg-warm-amberHover"
                >
                  {submitting ? 'Saving...' : 'Save Game'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-warm w-full max-w-md rounded-2xl p-6 border border-warm-border shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-warm-border">
              <h3 className="font-bold text-warm-text text-lg">Edit Game ({editGame.id_game})</h3>
              <button onClick={() => setShowEditModal(false)} className="text-warm-subtle hover:text-warm-text">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-warm-muted block mb-1">Game Name</label>
                <input
                  type="text"
                  required
                  value={editGame.name_game}
                  onChange={(e) => setEditGame({ ...editGame, name_game: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-sm focus:outline-none focus:border-warm-amber"
                />
              </div>
              <div>
                <label className="text-xs text-warm-muted block mb-1">Date Added</label>
                <input
                  type="date"
                  value={editGame.added || ''}
                  onChange={(e) => setEditGame({ ...editGame, added: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-sm focus:outline-none focus:border-warm-amber"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-warm-border text-warm-text hover:bg-warm-border/50 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-warm-amber text-warm-bg font-semibold text-sm hover:bg-warm-amberHover"
                >
                  {submitting ? 'Updating...' : 'Update Game'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-warm w-full max-w-sm rounded-2xl p-6 border border-warm-border shadow-2xl space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-warm-crimson/10 flex items-center justify-center text-warm-crimson">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-warm-text">Delete Game</h3>
            <p className="text-sm text-warm-muted">
              Are you sure you want to delete game <span className="text-warm-amber font-semibold">{deleteTargetId}</span>?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-warm-border text-warm-text hover:bg-warm-border/50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-warm-crimson text-white font-semibold text-sm hover:bg-red-600"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
