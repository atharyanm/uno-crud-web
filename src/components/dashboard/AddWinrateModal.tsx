'use client';

import React, { useState, useEffect } from 'react';
import { fetchData, insertData } from '@/lib/api';
import { X, Plus, UserPlus, MapPin, Gamepad2, Calendar, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddWinrateModal({ isOpen, onClose, onSuccess }: Props) {
  const [players, setPlayers] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [loserId, setLoserId] = useState<string>('');
  const [placeId, setPlaceId] = useState<string>('');
  const [gameId, setGameId] = useState<string>('');
  const [datetime, setDatetime] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadOptions();
      // Set default datetime to now in YYYY-MM-DDTHH:mm WIB
      const now = new Date();
      const localDatetime = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);
      setDatetime(localDatetime);
    }
  }, [isOpen]);

  const loadOptions = async () => {
    try {
      const [pData, plData, gData] = await Promise.all([
        fetchData('Player'),
        fetchData('Place'),
        fetchData('Game'),
      ]);
      setPlayers(pData);
      setPlaces(plData);
      setGames(gData);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const handleAddPlayer = (id: string) => {
    if (id && !selectedPlayerIds.includes(id)) {
      setSelectedPlayerIds([...selectedPlayerIds, id]);
    }
  };

  const handleRemovePlayer = (id: string) => {
    const next = selectedPlayerIds.filter((p) => p !== id);
    setSelectedPlayerIds(next);
    if (loserId === id) setLoserId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedPlayerIds.length === 0) {
      setError('Please select at least one player.');
      return;
    }
    if (!loserId) {
      setError('Please select the loser.');
      return;
    }
    if (!selectedPlayerIds.includes(loserId)) {
      setError('Loser must be one of the selected players.');
      return;
    }
    if (!placeId) {
      setError('Please select a place.');
      return;
    }
    if (!gameId) {
      setError('Please select a game.');
      return;
    }

    setSubmitting(true);

    try {
      const place = places.find((p) => p.id_place === placeId);
      const game = games.find((g) => g.id_game === gameId);

      const wibDate = new Date(datetime);
      const dateStr = `${wibDate.getFullYear()}-${String(
        wibDate.getMonth() + 1
      ).padStart(2, '0')}-${String(wibDate.getDate()).padStart(
        2,
        '0'
      )} ${String(wibDate.getHours()).padStart(2, '0')}:${String(
        wibDate.getMinutes()
      ).padStart(2, '0')}:${String(wibDate.getSeconds()).padStart(2, '0')}`;

      for (const pid of selectedPlayerIds) {
        const player = players.find((p) => p.id_player === pid);
        if (!player) continue;

        const lose = pid === loserId ? 1 : 0;

        const newData = {
          name_player: player.name,
          name_place: place?.name || '',
          lose: lose,
          date: dateStr,
          id_place: placeId,
          id_player: pid,
          name_game: game?.name_game || '',
        };

        await insertData('Data', newData);
      }

      onSuccess();
      onClose();
      // Reset form
      setSelectedPlayerIds([]);
      setLoserId('');
      setPlaceId('');
      setGameId('');
    } catch (err: any) {
      console.error(err);
      setError('Failed to record winrate session. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="glass-warm w-full max-w-lg rounded-2xl p-6 border border-warm-border shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-warm-border">
          <div className="flex items-center gap-2 text-warm-amber font-bold text-lg">
            <Plus className="w-5 h-5" />
            <span>Add Winrate Session</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-warm-subtle hover:text-warm-text hover:bg-warm-border/50 transition"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-warm-crimson/10 border border-warm-crimson/30 text-warm-crimson text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Players */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-warm-muted flex items-center gap-1.5">
              <UserPlus size={14} className="text-warm-amber" /> Select Players
            </label>
            <select
              onChange={(e) => {
                handleAddPlayer(e.target.value);
                e.target.value = '';
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-sm focus:outline-none focus:border-warm-amber transition"
            >
              <option value="">Choose player to add...</option>
              {players.map((p) => (
                <option key={p.id_player} value={p.id_player}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Tags display */}
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedPlayerIds.map((id) => {
                const p = players.find((pl) => pl.id_player === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-warm-amber/15 border border-warm-amber/30 text-warm-amber text-xs font-medium"
                  >
                    {p?.name || id}
                    <button
                      type="button"
                      onClick={() => handleRemovePlayer(id)}
                      className="hover:text-warm-crimson transition"
                    >
                      <X size={14} />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Select Loser */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-warm-muted">
              Select Loser
            </label>
            <select
              value={loserId}
              onChange={(e) => setLoserId(e.target.value)}
              required
              className="w-full py-2.5 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-sm focus:outline-none focus:border-warm-amber transition"
            >
              <option value="">Choose loser from selected players...</option>
              {selectedPlayerIds.map((id) => {
                const p = players.find((pl) => pl.id_player === id);
                return (
                  <option key={id} value={id}>
                    {p?.name || id}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Select Place & Game */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-warm-muted flex items-center gap-1">
                <MapPin size={14} className="text-warm-amber" /> Place
              </label>
              <select
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
                required
                className="w-full py-2.5 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-sm focus:outline-none focus:border-warm-amber transition"
              >
                <option value="">Select Place...</option>
                {places.map((pl) => (
                  <option key={pl.id_place} value={pl.id_place}>
                    {pl.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-warm-muted flex items-center gap-1">
                <Gamepad2 size={14} className="text-warm-amber" /> Game
              </label>
              <select
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                required
                className="w-full py-2.5 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-sm focus:outline-none focus:border-warm-amber transition"
              >
                <option value="">Select Game...</option>
                {games.map((g) => (
                  <option key={g.id_game} value={g.id_game}>
                    {g.name_game}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-warm-muted flex items-center gap-1">
              <Calendar size={14} className="text-warm-amber" /> Date & Time (WIB)
            </label>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              required
              className="w-full py-2.5 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-sm focus:outline-none focus:border-warm-amber transition"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-warm-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-warm-border text-warm-text hover:bg-warm-border/50 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-warm-amber hover:bg-warm-amberHover text-warm-bg font-semibold text-sm transition shadow-lg shadow-warm-amber/20 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Add Winrate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
