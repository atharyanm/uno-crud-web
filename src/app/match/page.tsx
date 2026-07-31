'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import AddWinrateModal from '@/components/dashboard/AddWinrateModal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { fetchData, updateData, deleteData } from '@/lib/api';
import { Gamepad2, Plus, Edit2, Trash2, Search, X, Filter, ChevronLeft, ChevronRight, AlertCircle, Calendar } from 'lucide-react';

export default function MatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [filterPlayer, setFilterPlayer] = useState('');
  const [filterPlace, setFilterPlace] = useState('');
  const [filterGame, setFilterGame] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Edit/Delete target
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
    loadAllData();
  }, [router]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [m, p, pl, g] = await Promise.all([
        fetchData('Data'),
        fetchData('Player'),
        fetchData('Place'),
        fetchData('Game'),
      ]);
      setMatches(m);
      setPlayers(p);
      setPlaces(pl);
      setGames(g);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord) return;
    setSubmitting(true);
    setError('');

    try {
      await updateData('Data', editRecord.id, {
        name_player: editRecord.name_player,
        name_place: editRecord.name_place,
        name_game: editRecord.name_game,
        lose: parseInt(editRecord.lose),
        date: editRecord.date,
        id_player: editRecord.id_player,
        id_place: editRecord.id_place,
      });
      setShowEditModal(false);
      setEditRecord(null);
      loadAllData();
    } catch (err: any) {
      console.error(err);
      setError('Failed to update match record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setSubmitting(true);
    try {
      await deleteData('Data', deleteTargetId);
      setShowDeleteModal(false);
      setDeleteTargetId('');
      loadAllData();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter & Search Logic
  let filtered = [...matches];

  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        (m.name_player && m.name_player.toLowerCase().includes(query)) ||
        (m.name_place && m.name_place.toLowerCase().includes(query)) ||
        (m.name_game && m.name_game.toLowerCase().includes(query)) ||
        (m.id && m.id.toString().includes(query))
    );
  }

  if (filterPlayer) {
    filtered = filtered.filter((m) => m.id_player === filterPlayer);
  }
  if (filterPlace) {
    filtered = filtered.filter((m) => m.id_place === filterPlace);
  }
  if (filterGame) {
    const gObj = games.find((g) => g.id_game === filterGame);
    if (gObj) filtered = filtered.filter((m) => m.name_game === gObj.name_game);
  }
  if (filterStartDate) {
    filtered = filtered.filter((m) => {
      const dateStr = new Date(m.date).toISOString().split('T')[0];
      return dateStr >= filterStartDate;
    });
  }
  if (filterEndDate) {
    filtered = filtered.filter((m) => {
      const dateStr = new Date(m.date).toISOString().split('T')[0];
      return dateStr <= filterEndDate;
    });
  }

  const sortedMatches = filtered.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalPages = Math.max(1, Math.ceil(sortedMatches.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMatches = sortedMatches.slice(startIndex, startIndex + itemsPerPage);

  const formatGameDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const match = dateStr.match(/(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}:\d{2})/);
      if (match) {
        const [y, m, d] = match[1].split('-');
        const [hh, mm] = match[2].split(':');
        return `${d}/${m}/${y}, ${hh}.${mm}`;
      }
      return new Date(dateStr).toLocaleDateString('en-GB');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-warm-bg">
      <Sidebar />

      <main className="lg:pl-64 pt-20 lg:pt-6 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pb-2 border-b border-warm-border/60">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-warm-text tracking-tight flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-warm-amber" /> Match Management
            </h1>
            <p className="text-xs sm:text-sm text-warm-muted">
              Kelola, edit, dan hapus riwayat hasil pertandingan (match records) tongkrongan.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="py-2.5 px-4 rounded-xl bg-warm-amber hover:bg-warm-amberHover text-warm-bg font-semibold text-sm transition shadow-lg shadow-warm-amber/15 flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            <span>Add Winrate Match</span>
          </button>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="glass-warm p-4 rounded-2xl border border-warm-border space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between border-b border-warm-border/40 pb-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-subtle w-4 h-4" />
              <input
                type="text"
                placeholder="Cari nama player, tempat, atau game..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-warm-bg border border-warm-border text-warm-text placeholder:text-warm-subtle text-xs focus:outline-none focus:border-warm-amber"
              />
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-warm-amber flex items-center gap-1.5">
              <Filter size={14} /> Total {sortedMatches.length} Matches Found
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="text-[11px] text-warm-subtle block mb-1">Player</label>
              <select
                value={filterPlayer}
                onChange={(e) => {
                  setFilterPlayer(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 rounded-xl bg-warm-bg border border-warm-border text-xs text-warm-text focus:outline-none focus:border-warm-amber"
              >
                <option value="">All Players</option>
                {players.map((p) => (
                  <option key={p.id_player} value={p.id_player}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-warm-subtle block mb-1">Place</label>
              <select
                value={filterPlace}
                onChange={(e) => {
                  setFilterPlace(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 rounded-xl bg-warm-bg border border-warm-border text-xs text-warm-text focus:outline-none focus:border-warm-amber"
              >
                <option value="">All Places</option>
                {places.map((pl) => (
                  <option key={pl.id_place} value={pl.id_place}>
                    {pl.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-warm-subtle block mb-1">Game</label>
              <select
                value={filterGame}
                onChange={(e) => {
                  setFilterGame(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 rounded-xl bg-warm-bg border border-warm-border text-xs text-warm-text focus:outline-none focus:border-warm-amber"
              >
                <option value="">All Games</option>
                {games.map((g) => (
                  <option key={g.id_game} value={g.id_game}>
                    {g.name_game}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-warm-subtle block mb-1">Start Date</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => {
                  setFilterStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-1.5 px-3 rounded-xl bg-warm-bg border border-warm-border text-xs text-warm-text focus:outline-none focus:border-warm-amber"
              />
            </div>

            <div>
              <label className="text-[11px] text-warm-subtle block mb-1">End Date</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => {
                  setFilterEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-1.5 px-3 rounded-xl bg-warm-bg border border-warm-border text-xs text-warm-text focus:outline-none focus:border-warm-amber"
              />
            </div>
          </div>
        </div>

        {/* Table Display */}
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <div className="w-full overflow-x-auto rounded-2xl border border-warm-border glass-warm shadow-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-warm-bg/60 border-b border-warm-border text-xs uppercase tracking-wider text-warm-muted">
                <tr>
                  <th className="py-3.5 px-4 font-semibold w-16">ID</th>
                  <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                  <th className="py-3.5 px-4 font-semibold">Player</th>
                  <th className="py-3.5 px-4 font-semibold">Place</th>
                  <th className="py-3.5 px-4 font-semibold">Game</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Result</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-border/40">
                {paginatedMatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-warm-muted text-sm">
                      No match records found
                    </td>
                  </tr>
                ) : (
                  paginatedMatches.map((m) => (
                    <tr key={m.id} className="hover:bg-warm-cardHover/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-warm-amber text-xs notranslate" translate="no">
                        #{m.id}
                      </td>
                      <td className="py-3.5 px-4 text-warm-muted font-medium text-xs notranslate" translate="no">
                        {formatGameDate(m.date)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-warm-text">
                        {m.name_player}
                      </td>
                      <td className="py-3.5 px-4 text-warm-muted text-xs">
                        {m.name_place}
                      </td>
                      <td className="py-3.5 px-4 text-warm-muted text-xs">
                        {m.name_game}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {m.lose === 1 || m.lose === '1' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warm-crimson/15 text-warm-crimson border border-warm-crimson/30">
                            Lose
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warm-emerald/15 text-warm-emerald border border-warm-emerald/30">
                            Win
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditRecord({ ...m });
                              setShowEditModal(true);
                            }}
                            className="p-1.5 rounded-lg border border-warm-border text-warm-amber hover:bg-warm-amber/10 transition"
                            title="Edit Match"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTargetId(m.id);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 rounded-lg border border-warm-border text-warm-crimson hover:bg-warm-crimson/10 transition"
                            title="Delete Match"
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

            {/* Pagination Controls */}
            <div className="p-4 border-t border-warm-border flex items-center justify-between text-xs text-warm-muted">
              <span>
                Showing {sortedMatches.length > 0 ? startIndex + 1 : 0} to{' '}
                {Math.min(startIndex + itemsPerPage, sortedMatches.length)} of{' '}
                {sortedMatches.length} matches
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-warm-border hover:bg-warm-border/50 transition disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 font-semibold text-warm-text">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-warm-border hover:bg-warm-border/50 transition disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Match Modal */}
      {showEditModal && editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-warm w-full max-w-md rounded-2xl p-6 border border-warm-border shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-warm-border">
              <h3 className="font-bold text-warm-text text-lg">Edit Match #{editRecord.id}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-warm-subtle hover:text-warm-text">
                <X size={20} />
              </button>
            </div>
            {error && (
              <div className="p-3 rounded-xl bg-warm-crimson/10 border border-warm-crimson/30 text-warm-crimson text-xs">
                {error}
              </div>
            )}
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-warm-muted block mb-1">Player Name</label>
                <input
                  type="text"
                  required
                  value={editRecord.name_player}
                  onChange={(e) => setEditRecord({ ...editRecord, name_player: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-xs focus:outline-none focus:border-warm-amber"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-warm-muted block mb-1">Place Name</label>
                  <input
                    type="text"
                    required
                    value={editRecord.name_place}
                    onChange={(e) => setEditRecord({ ...editRecord, name_place: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-xs focus:outline-none focus:border-warm-amber"
                  />
                </div>

                <div>
                  <label className="text-xs text-warm-muted block mb-1">Game Name</label>
                  <input
                    type="text"
                    required
                    value={editRecord.name_game}
                    onChange={(e) => setEditRecord({ ...editRecord, name_game: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-xs focus:outline-none focus:border-warm-amber"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-warm-muted block mb-1">Result Status</label>
                <select
                  value={editRecord.lose}
                  onChange={(e) => setEditRecord({ ...editRecord, lose: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-xs focus:outline-none focus:border-warm-amber"
                >
                  <option value={0}>Win (Menang)</option>
                  <option value={1}>Lose (Kalah)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-warm-muted block mb-1">Date & Time</label>
                <input
                  type="text"
                  required
                  value={editRecord.date}
                  onChange={(e) => setEditRecord({ ...editRecord, date: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-xs focus:outline-none focus:border-warm-amber font-mono"
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
                  {submitting ? 'Updating...' : 'Update Match'}
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
            <h3 className="text-lg font-bold text-warm-text">Delete Match Record</h3>
            <p className="text-sm text-warm-muted">
              Are you sure you want to delete match record <span className="text-warm-amber font-semibold">#{deleteTargetId}</span>?
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

      {/* Add Modal */}
      <AddWinrateModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadAllData}
      />
    </div>
  );
}
