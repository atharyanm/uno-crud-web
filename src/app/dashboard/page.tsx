'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import AddWinrateModal from '@/components/dashboard/AddWinrateModal';
import ReportModal from '@/components/dashboard/ReportModal';
import { CardSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { fetchData } from '@/lib/api';
import {
  Trophy,
  Skull,
  Plus,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Gamepad2,
  Calendar,
  User,
  MapPin,
  RefreshCw,
  Search,
  Trash2
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Raw data
  const [players, setPlayers] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [dataRecords, setDataRecords] = useState<any[]>([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Filters
  const [leaderboardYear, setLeaderboardYear] = useState('2026');
  const [leaderboardGame, setLeaderboardGame] = useState('all');
  const [lastLoserYear, setLastLoserYear] = useState('2026');
  const [lastLoserGame, setLastLoserGame] = useState('');

  // Recent Games Filters & Pagination
  const [filterPlayer, setFilterPlayer] = useState('');
  const [filterPlace, setFilterPlace] = useState('');
  const [filterGame, setFilterGame] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const stored = localStorage.getItem('loggedInUser');
    if (!stored) {
      router.push('/login');
      return;
    }
    loadAllData();
  }, [router]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [p, pl, g, d] = await Promise.all([
        fetchData('Player'),
        fetchData('Place'),
        fetchData('Game'),
        fetchData('Data'),
      ]);
      setPlayers(p);
      setPlaces(pl);
      setGames(g);
      setDataRecords(d);

      // Default last loser game to Uno if present
      const uno = g.find((game) => game.name_game.toLowerCase() === 'uno');
      if (uno) setLastLoserGame(uno.id_game);
      else if (g.length > 0) setLastLoserGame(g[0].id_game);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Compute Leaderboard
  let filteredData = dataRecords;
  if (leaderboardYear !== 'all') {
    filteredData = filteredData.filter(
      (d) => new Date(d.date).getFullYear().toString() === leaderboardYear
    );
  }
  if (leaderboardGame !== 'all') {
    const targetGame = games.find((g) => g.id_game === leaderboardGame);
    if (targetGame) {
      filteredData = filteredData.filter((d) => d.name_game === targetGame.name_game);
    }
  }

  const playerStats: Record<string, { name: string; wins: number; losses: number; points: number }> = {};
  players.forEach((p) => {
    playerStats[p.id_player] = { name: p.name, wins: 0, losses: 0, points: 0 };
  });

  filteredData.forEach((d) => {
    if (playerStats[d.id_player]) {
      if (d.lose === 0 || d.lose === '0') {
        playerStats[d.id_player].wins += 1;
        playerStats[d.id_player].points += 3;
      } else {
        playerStats[d.id_player].losses += 1;
        playerStats[d.id_player].points -= 1;
      }
    }
  });

  const leaderboard = Object.values(playerStats)
    .map((s) => {
      const total = s.wins + s.losses;
      const winrate = total > 0 ? (s.wins / total) * 100 : 0;
      return { ...s, total, winrate };
    })
    .sort((a, b) => (b.points !== a.points ? b.points - a.points : b.winrate - a.winrate));

  const bestPlayer = leaderboard.length > 0 ? leaderboard[0] : null;
  const playersWithGames = leaderboard.filter((p) => p.total > 0);
  const worstPlayer = playersWithGames.length > 0 ? playersWithGames[playersWithGames.length - 1] : null;

  // Compute Last Loser
  let lastLoser: any = null;
  let lastLoserGameName = '';

  const loserFiltered = dataRecords.filter((d) => {
    const yr = new Date(d.date).getFullYear().toString();
    const gameMatch = lastLoserGame
      ? d.name_game === games.find((g) => g.id_game === lastLoserGame)?.name_game
      : true;
    return yr === lastLoserYear && gameMatch && (d.lose === 1 || d.lose === '1');
  });

  if (loserFiltered.length > 0) {
    const sortedLosers = loserFiltered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    lastLoser = sortedLosers[0];
    lastLoserGameName = lastLoser.name_game || '';
  }

  // Filter Recent Games
  let recentGames = [...dataRecords];
  if (filterPlayer) {
    recentGames = recentGames.filter((d) => d.id_player === filterPlayer);
  }
  if (filterPlace) {
    recentGames = recentGames.filter((d) => d.id_place === filterPlace);
  }
  if (filterGame) {
    const gObj = games.find((g) => g.id_game === filterGame);
    if (gObj) recentGames = recentGames.filter((d) => d.name_game === gObj.name_game);
  }
  if (filterStartDate) {
    recentGames = recentGames.filter((d) => {
      const dateStr = new Date(d.date).toISOString().split('T')[0];
      return dateStr >= filterStartDate;
    });
  }
  if (filterEndDate) {
    recentGames = recentGames.filter((d) => {
      const dateStr = new Date(d.date).toISOString().split('T')[0];
      return dateStr <= filterEndDate;
    });
  }

  const sortedRecentGames = recentGames.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalPages = Math.max(1, Math.ceil(sortedRecentGames.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGames = sortedRecentGames.slice(startIndex, startIndex + itemsPerPage);

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

      {/* Main Content Area */}
      <main className="lg:pl-64 pt-20 lg:pt-6 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Top Action Header */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pb-2 border-b border-warm-border/60">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-warm-text tracking-tight">
              Dashboard Analytics
            </h1>
            <p className="text-xs sm:text-sm text-warm-muted">
              Live player leaderboard, game win rates, and recent match metrics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-warm-amber hover:bg-warm-amberHover text-warm-bg font-semibold text-sm transition shadow-lg shadow-warm-amber/15 flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              <span>Add Winrate</span>
            </button>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl glass-warm border border-warm-border text-warm-text hover:border-warm-amber/50 font-medium text-sm transition flex items-center justify-center gap-2"
            >
              <FileText size={18} className="text-warm-amber" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {/* Highlight Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            <>
              {/* Best Player Card */}
              <div className="glass-warm rounded-2xl p-5 border border-warm-border hover:border-warm-amber/40 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 bg-warm-amber/5 rounded-bl-full pointer-events-none group-hover:bg-warm-amber/10 transition" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-warm-amber font-semibold text-sm">
                    <Trophy className="w-4 h-4" />
                    <span>Best Player</span>
                  </div>
                  <div className="flex gap-1">
                    <select
                      value={leaderboardYear}
                      onChange={(e) => setLeaderboardYear(e.target.value)}
                      className="py-1 px-2 rounded-lg bg-warm-bg border border-warm-border text-xs text-warm-text"
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="all">All Time</option>
                    </select>
                  </div>
                </div>

                <div className="text-center py-2 space-y-3">
                  <h3 className="text-xl font-bold text-warm-text tracking-wide">
                    {bestPlayer ? bestPlayer.name : 'No Data'}
                  </h3>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-warm-border/50">
                    <div>
                      <CheckCircle2 className="w-4 h-4 text-warm-emerald mx-auto mb-1" />
                      <p className="text-sm font-bold text-warm-text">
                        {bestPlayer ? bestPlayer.wins : 0}
                      </p>
                      <span className="text-[10px] text-warm-subtle">Wins</span>
                    </div>
                    <div>
                      <XCircle className="w-4 h-4 text-warm-crimson mx-auto mb-1" />
                      <p className="text-sm font-bold text-warm-text">
                        {bestPlayer ? bestPlayer.losses : 0}
                      </p>
                      <span className="text-[10px] text-warm-subtle">Losses</span>
                    </div>
                    <div>
                      <Gamepad2 className="w-4 h-4 text-warm-amber mx-auto mb-1" />
                      <p className="text-sm font-bold text-warm-text">
                        {bestPlayer ? bestPlayer.total : 0}
                      </p>
                      <span className="text-[10px] text-warm-subtle">Matches</span>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-warm-amber pt-1">
                    {bestPlayer ? bestPlayer.points : 0} Points &bull;{' '}
                    {bestPlayer ? bestPlayer.winrate.toFixed(1) : 0}% Winrate
                  </p>
                </div>
              </div>

              {/* Worst Player Card */}
              <div className="glass-warm rounded-2xl p-5 border border-warm-border hover:border-warm-crimson/40 transition-all duration-300 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-warm-crimson font-semibold text-sm">
                    <Skull className="w-4 h-4" />
                    <span>Worst Player</span>
                  </div>
                  <span className="text-xs text-warm-subtle font-medium">Lowest Score</span>
                </div>

                <div className="text-center py-2 space-y-3">
                  <h3 className="text-xl font-bold text-warm-text tracking-wide">
                    {worstPlayer ? worstPlayer.name : 'No Data'}
                  </h3>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-warm-border/50">
                    <div>
                      <CheckCircle2 className="w-4 h-4 text-warm-emerald mx-auto mb-1" />
                      <p className="text-sm font-bold text-warm-text">
                        {worstPlayer ? worstPlayer.wins : 0}
                      </p>
                      <span className="text-[10px] text-warm-subtle">Wins</span>
                    </div>
                    <div>
                      <XCircle className="w-4 h-4 text-warm-crimson mx-auto mb-1" />
                      <p className="text-sm font-bold text-warm-text">
                        {worstPlayer ? worstPlayer.losses : 0}
                      </p>
                      <span className="text-[10px] text-warm-subtle">Losses</span>
                    </div>
                    <div>
                      <Gamepad2 className="w-4 h-4 text-warm-amber mx-auto mb-1" />
                      <p className="text-sm font-bold text-warm-text">
                        {worstPlayer ? worstPlayer.total : 0}
                      </p>
                      <span className="text-[10px] text-warm-subtle">Matches</span>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-warm-crimson pt-1">
                    {worstPlayer ? worstPlayer.points : 0} Points &bull;{' '}
                    {worstPlayer ? worstPlayer.winrate.toFixed(1) : 0}% Winrate
                  </p>
                </div>
              </div>

              {/* Last Loser Card */}
              <div className="glass-warm rounded-2xl p-5 border border-warm-border hover:border-warm-terracotta/40 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-warm-terracotta font-semibold text-sm">
                    <Trophy className="w-4 h-4 rotate-180" />
                    <span>Last Loser</span>
                  </div>
                  <div className="flex gap-1">
                    <select
                      value={lastLoserYear}
                      onChange={(e) => setLastLoserYear(e.target.value)}
                      className="py-1 px-2 rounded-lg bg-warm-bg border border-warm-border text-xs text-warm-text"
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                    </select>
                  </div>
                </div>

                <div className="text-center py-4 space-y-2">
                  <h3 className="text-xl font-bold text-warm-text tracking-wide">
                    {lastLoser ? lastLoser.name_player : 'No Loser Found'}
                  </h3>
                  <p className="text-xs text-warm-muted">
                    {lastLoser ? (
                      <>
                        Lost on {formatGameDate(lastLoser.date)} at{' '}
                        <span className="text-warm-amber font-medium">
                          {lastLoser.name_place}
                        </span>
                      </>
                    ) : (
                      'No matches recorded for filter'
                    )}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Leaderboard Table */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-warm-text flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warm-amber" />
              <span>Player Leaderboard</span>
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={leaderboardGame}
                onChange={(e) => setLeaderboardGame(e.target.value)}
                className="py-2 px-3 rounded-xl bg-warm-card border border-warm-border text-xs font-medium text-warm-text focus:outline-none focus:border-warm-amber"
              >
                <option value="all">All Games</option>
                {games.map((g) => (
                  <option key={g.id_game} value={g.id_game}>
                    {g.name_game}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : (
            <div className="w-full overflow-x-auto rounded-2xl border border-warm-border glass-warm shadow-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-warm-bg/60 border-b border-warm-border text-xs uppercase tracking-wider text-warm-muted">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold text-center w-16">Rank</th>
                    <th className="py-3.5 px-4 font-semibold">Player</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Points</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Wins</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Losses</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Winrate (%)</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Total Games</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-border/40">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-warm-muted text-sm">
                        No leaderboard data available
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((player, idx) => (
                      <tr
                        key={player.name}
                        className="hover:bg-warm-cardHover/50 transition-colors"
                      >
                        <td className="py-3.5 px-4 text-center font-bold">
                          {idx === 0 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-warm-amber/20 text-warm-amber border border-warm-amber/40 text-xs">
                              1
                            </span>
                          ) : idx === 1 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-warm-text/20 text-warm-text border border-warm-text/40 text-xs">
                              2
                            </span>
                          ) : idx === 2 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-warm-terracotta/20 text-warm-terracotta border border-warm-terracotta/40 text-xs">
                              3
                            </span>
                          ) : (
                            <span className="text-warm-subtle">{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-warm-text">
                          {player.name}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-warm-amber">
                          {player.points}
                        </td>
                        <td className="py-3.5 px-4 text-center text-warm-emerald font-medium">
                          {player.wins}
                        </td>
                        <td className="py-3.5 px-4 text-center text-warm-crimson font-medium">
                          {player.losses}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-warm-text">
                          {player.winrate.toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-4 text-center text-warm-muted">
                          {player.total}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Games Section */}
        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-warm-text flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-warm-amber" />
              <span>Recent Games</span>
            </h2>
          </div>

          {/* Combined Filters Toolbar */}
          <div className="glass-warm p-4 rounded-2xl border border-warm-border space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warm-muted pb-2 border-b border-warm-border/40">
              <Filter size={14} className="text-warm-amber" /> Filter Recent Matches
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
            <TableSkeleton rows={5} cols={5} />
          ) : (
            <div className="w-full overflow-x-auto rounded-2xl border border-warm-border glass-warm shadow-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-warm-bg/60 border-b border-warm-border text-xs uppercase tracking-wider text-warm-muted">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                    <th className="py-3.5 px-4 font-semibold">Player</th>
                    <th className="py-3.5 px-4 font-semibold">Place</th>
                    <th className="py-3.5 px-4 font-semibold">Game</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-border/40">
                  {paginatedGames.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-warm-muted text-sm">
                        No matches found matching filter
                      </td>
                    </tr>
                  ) : (
                    paginatedGames.map((game, i) => {
                      const isLoss = game.lose === 1 || game.lose === '0' ? false : game.lose === 1 || game.lose === '1';
                      return (
                        <tr
                          key={game.id || i}
                          className="hover:bg-warm-cardHover/50 transition-colors"
                        >
                          <td className="py-3.5 px-4 text-warm-muted font-medium text-xs">
                            {formatGameDate(game.date)}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-warm-text">
                            {game.name_player}
                          </td>
                          <td className="py-3.5 px-4 text-warm-muted text-xs">
                            {game.name_place}
                          </td>
                          <td className="py-3.5 px-4 text-warm-muted text-xs">
                            {game.name_game}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {game.lose === 1 || game.lose === '1' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warm-crimson/15 text-warm-crimson border border-warm-crimson/30">
                                Lose
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warm-emerald/15 text-warm-emerald border border-warm-emerald/30">
                                Win
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="p-4 border-t border-warm-border flex items-center justify-between text-xs text-warm-muted">
                <span>
                  Showing {sortedRecentGames.length > 0 ? startIndex + 1 : 0} to{' '}
                  {Math.min(startIndex + itemsPerPage, sortedRecentGames.length)} of{' '}
                  {sortedRecentGames.length} matches
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
        </div>
      </main>

      {/* Modals */}
      <AddWinrateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadAllData}
      />
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}
