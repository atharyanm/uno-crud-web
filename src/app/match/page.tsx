'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import AddWinrateModal from '@/components/dashboard/AddWinrateModal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { fetchData, updateData, deleteData } from '@/lib/api';
import { Gamepad2, Plus, Edit2, Trash2, Search, X, Filter, ChevronLeft, ChevronRight, AlertCircle, Calendar, MapPin, Users, Flame } from 'lucide-react';

interface MatchSession {
  sessionId: string;
  date: string;
  name_place: string;
  name_game: string;
  id_place?: string;
  records: any[];
  loser: any;
  winners: any[];
}

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
  const [editSession, setEditSession] = useState<MatchSession | null>(null);
  const [deleteSessionTarget, setDeleteSessionTarget] = useState<MatchSession | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Edit session form fields
  const [editPlaceName, setEditPlaceName] = useState('');
  const [editGameName, setEditGameName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editLoserPlayerId, setEditLoserPlayerId] = useState('');

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

  // Group raw records into Match Sessions (Grouped by date + place + game)
  const groupedSessionsMap = new Map<string, MatchSession>();

  matches.forEach((rec) => {
    // Session key based on date + place + game
    const dateKey = rec.date ? rec.date.trim() : 'no-date';
    const placeKey = rec.name_place ? rec.name_place.trim() : 'no-place';
    const gameKey = rec.name_game ? rec.name_game.trim() : 'no-game';
    const sessionId = `${dateKey}___${placeKey}___${gameKey}`;

    if (!groupedSessionsMap.has(sessionId)) {
      groupedSessionsMap.set(sessionId, {
        sessionId,
        date: rec.date,
        name_place: rec.name_place,
        name_game: rec.name_game,
        id_place: rec.id_place,
        records: [],
        loser: null,
        winners: [],
      });
    }

    const session = groupedSessionsMap.get(sessionId)!;
    session.records.push(rec);

    if (rec.lose === 1 || rec.lose === '1') {
      session.loser = rec;
    } else {
      session.winners.push(rec);
    }
  });

  const allSessions = Array.from(groupedSessionsMap.values());

  // Filter Logic on Sessions
  let filteredSessions = [...allSessions];

  if (search) {
    const q = search.toLowerCase();
    filteredSessions = filteredSessions.filter((s) => {
      const playerMatch = s.records.some((r) => r.name_player && r.name_player.toLowerCase().includes(q));
      const placeMatch = s.name_place && s.name_place.toLowerCase().includes(q);
      const gameMatch = s.name_game && s.name_game.toLowerCase().includes(q);
      return playerMatch || placeMatch || gameMatch;
    });
  }

  if (filterPlayer) {
    filteredSessions = filteredSessions.filter((s) =>
      s.records.some((r) => r.id_player === filterPlayer)
    );
  }
  if (filterPlace) {
    filteredSessions = filteredSessions.filter((s) => s.id_place === filterPlace || s.records.some((r) => r.id_place === filterPlace));
  }
  if (filterGame) {
    const gObj = games.find((g) => g.id_game === filterGame);
    if (gObj) {
      filteredSessions = filteredSessions.filter((s) => s.name_game === gObj.name_game);
    }
  }
  if (filterStartDate) {
    filteredSessions = filteredSessions.filter((s) => {
      const dateStr = new Date(s.date).toISOString().split('T')[0];
      return dateStr >= filterStartDate;
    });
  }
  if (filterEndDate) {
    filteredSessions = filteredSessions.filter((s) => {
      const dateStr = new Date(s.date).toISOString().split('T')[0];
      return dateStr <= filterEndDate;
    });
  }

  // Sort Sessions by Date Descending
  const sortedSessions = filteredSessions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalPages = Math.max(1, Math.ceil(sortedSessions.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSessions = sortedSessions.slice(startIndex, startIndex + itemsPerPage);

  const openEditModal = (session: MatchSession) => {
    setEditSession(session);
    setEditPlaceName(session.name_place || '');
    setEditGameName(session.name_game || '');
    setEditDate(session.date || '');
    setEditLoserPlayerId(session.loser ? session.loser.id_player : '');
    setError('');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSession) return;
    setSubmitting(true);
    setError('');

    try {
      // Update each record in the session
      for (const rec of editSession.records) {
        const isLoser = rec.id_player === editLoserPlayerId;
        await updateData('Data', rec.id, {
          name_place: editPlaceName,
          name_game: editGameName,
          date: editDate,
          lose: isLoser ? 1 : 0,
        });
      }

      setShowEditModal(false);
      setEditSession(null);
      loadAllData();
    } catch (err: any) {
      console.error(err);
      setError('Failed to update match session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteSessionTarget) return;
    setSubmitting(true);
    try {
      for (const rec of deleteSessionTarget.records) {
        await deleteData('Data', rec.id);
      }
      setShowDeleteModal(false);
      setDeleteSessionTarget(null);
      loadAllData();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

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

      <main className="lg:pl-64 pt-24 lg:pt-24 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pb-2 border-b border-warm-border/60">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-warm-text tracking-tight flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-warm-amber" /> Grouped Match Management
            </h1>
            <p className="text-xs sm:text-sm text-warm-muted">
              Kelola, edit, dan hapus sesi pertandingan yang terkelompokan (*grouped by session*).
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
              <Filter size={14} /> {sortedSessions.length} Grouped Match Sessions
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

        {/* Grouped Match Sessions Cards / List */}
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : (
          <div className="space-y-4">
            {paginatedSessions.length === 0 ? (
              <div className="glass-warm p-8 text-center rounded-2xl border border-warm-border text-warm-muted text-sm">
                Tidak ada sesi pertandingan ditemukan.
              </div>
            ) : (
              paginatedSessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="glass-warm rounded-2xl border border-warm-border p-5 hover:border-warm-amber/30 transition-all shadow-lg space-y-4"
                >
                  {/* Session Header Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-warm-border/50">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-warm-amber font-semibold bg-warm-amber/10 px-3 py-1 rounded-full border border-warm-amber/30 notranslate" translate="no">
                        <Calendar size={14} />
                        <span>{formatGameDate(session.date)}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-warm-text font-medium bg-warm-card px-3 py-1 rounded-full border border-warm-border">
                        <MapPin size={14} className="text-warm-amber" />
                        <span>{session.name_place || 'No Place'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-warm-gold font-medium bg-warm-card px-3 py-1 rounded-full border border-warm-border">
                        <Gamepad2 size={14} className="text-warm-gold" />
                        <span>{session.name_game || 'Game'}</span>
                      </div>
                    </div>

                    {/* Actions for entire session */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => openEditModal(session)}
                        className="py-1.5 px-3 rounded-xl border border-warm-amber/40 text-warm-amber hover:bg-warm-amber/10 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Edit2 size={14} />
                        <span>Edit Session</span>
                      </button>
                      <button
                        onClick={() => {
                          setDeleteSessionTarget(session);
                          setShowDeleteModal(true);
                        }}
                        className="py-1.5 px-3 rounded-xl border border-warm-crimson/40 text-warm-crimson hover:bg-warm-crimson/10 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Trash2 size={14} />
                        <span>Delete Session</span>
                      </button>
                    </div>
                  </div>

                  {/* Players in this Grouped Match Session */}
                  <div className="space-y-2">
                    <span className="text-[11px] uppercase tracking-wider text-warm-subtle font-semibold flex items-center gap-1">
                      <Users size={12} className="text-warm-amber" /> Participating Players ({session.records.length})
                    </span>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {session.records.map((r) => {
                        const isLoser = r.lose === 1 || r.lose === '1';
                        return (
                          <div
                            key={r.id}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                              isLoser
                                ? 'bg-warm-crimson/15 text-warm-crimson border-warm-crimson/30 shadow-sm shadow-warm-crimson/10'
                                : 'bg-warm-emerald/15 text-warm-emerald border-warm-emerald/30'
                            }`}
                          >
                            <span>{r.name_player}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                                isLoser
                                  ? 'bg-warm-crimson text-white'
                                  : 'bg-warm-emerald/30 text-warm-emerald'
                              }`}
                            >
                              {isLoser ? 'Lose' : 'Win'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Pagination Controls */}
            <div className="p-4 border-t border-warm-border flex items-center justify-between text-xs text-warm-muted glass-warm rounded-2xl">
              <span>
                Showing {sortedSessions.length > 0 ? startIndex + 1 : 0} to{' '}
                {Math.min(startIndex + itemsPerPage, sortedSessions.length)} of{' '}
                {sortedSessions.length} sessions
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

      {/* Edit Session Modal */}
      {showEditModal && editSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-warm w-full max-w-md rounded-2xl p-6 border border-warm-border shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-warm-border">
              <h3 className="font-bold text-warm-text text-lg">Edit Grouped Match Session</h3>
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
                <label className="text-xs text-warm-muted block mb-1">Place Location</label>
                <input
                  type="text"
                  required
                  value={editPlaceName}
                  onChange={(e) => setEditPlaceName(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-xs focus:outline-none focus:border-warm-amber"
                />
              </div>

              <div>
                <label className="text-xs text-warm-muted block mb-1">Game Name</label>
                <input
                  type="text"
                  required
                  value={editGameName}
                  onChange={(e) => setEditGameName(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-xs focus:outline-none focus:border-warm-amber"
                />
              </div>

              <div>
                <label className="text-xs text-warm-muted block mb-1">Select Loser in Session</label>
                <select
                  value={editLoserPlayerId}
                  onChange={(e) => setEditLoserPlayerId(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-xs focus:outline-none focus:border-warm-amber"
                >
                  {editSession.records.map((r) => (
                    <option key={r.id_player} value={r.id_player}>
                      {r.name_player} ({r.id_player})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-warm-muted block mb-1">Date & Time (WIB)</label>
                <input
                  type="text"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
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
                  {submitting ? 'Updating...' : 'Update Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Session Confirmation Modal */}
      {showDeleteModal && deleteSessionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-warm w-full max-w-sm rounded-2xl p-6 border border-warm-border shadow-2xl space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-warm-crimson/10 flex items-center justify-center text-warm-crimson">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-warm-text">Delete Grouped Session</h3>
            <p className="text-sm text-warm-muted">
              Hapus seluruh sesi match ini ({deleteSessionTarget.records.length} pemain) pada tanggal{' '}
              <span className="text-warm-amber font-semibold">{formatGameDate(deleteSessionTarget.date)}</span>?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-warm-border text-warm-text hover:bg-warm-border/50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSession}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-warm-crimson text-white font-semibold text-sm hover:bg-red-600"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete Session'}
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
