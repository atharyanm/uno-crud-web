'use client';

import React, { useState, useEffect } from 'react';
import { fetchData } from '@/lib/api';
import { X, FileText, Download, Award } from 'lucide-react';
import jsPDF from 'jspdf';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({ isOpen, onClose }: Props) {
  const [players, setPlayers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedGameId, setSelectedGameId] = useState('all');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      Promise.all([fetchData('Player'), fetchData('Game')]).then(([p, g]) => {
        setPlayers(p);
        setGames(g);
        if (p.length > 0) setSelectedPlayerId(p[0].id_player);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGeneratePDF = async () => {
    if (!selectedPlayerId) return;
    setGenerating(true);

    try {
      const allData = await fetchData('Data');
      const player = players.find((p) => p.id_player === selectedPlayerId);
      const playerName = player ? player.name : 'Player';

      let filtered = allData.filter((d) => d.id_player === selectedPlayerId);

      if (selectedYear !== 'all') {
        filtered = filtered.filter((d) => {
          const yr = new Date(d.date).getFullYear().toString();
          return yr === selectedYear;
        });
      }

      if (selectedGameId !== 'all') {
        const game = games.find((g) => g.id_game === selectedGameId);
        if (game) {
          filtered = filtered.filter((d) => d.name_game === game.name_game);
        }
      }

      const totalMatches = filtered.length;
      const losses = filtered.filter((d) => d.lose === 1 || d.lose === '1').length;
      const wins = totalMatches - losses;
      const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : '0.0';

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Warm Dark Certificate Styling
      doc.setFillColor(18, 17, 16);
      doc.rect(0, 0, 297, 210, 'F');

      // Double Frame Border
      doc.setDrawColor(245, 158, 11); // Warm Amber
      doc.setLineWidth(2);
      doc.rect(10, 10, 277, 190);

      doc.setDrawColor(42, 38, 34);
      doc.setLineWidth(0.5);
      doc.rect(14, 14, 269, 182);

      // Certificate Header
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICATE OF PERFORMANCE', 148.5, 45, { align: 'center' });

      doc.setTextColor(168, 162, 158);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('SABUNG WIN RATE CALCULATOR ANALYTICS', 148.5, 54, { align: 'center' });

      // Recipient Line
      doc.setTextColor(243, 241, 238);
      doc.setFontSize(14);
      doc.text('This official certificate is proudly presented to:', 148.5, 75, { align: 'center' });

      doc.setTextColor(251, 191, 36); // Warm Gold
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.text(playerName.toUpperCase(), 148.5, 93, { align: 'center' });

      // Stats Description
      doc.setTextColor(243, 241, 238);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `For performance in year ${selectedYear === 'all' ? 'All Time' : selectedYear} (${
          selectedGameId === 'all'
            ? 'All Games'
            : games.find((g) => g.id_game === selectedGameId)?.name_game || 'Game'
        }):`,
        148.5,
        112,
        { align: 'center' }
      );

      // Stats Grid Box
      doc.setFillColor(26, 24, 22);
      doc.setDrawColor(42, 38, 34);
      doc.roundedRect(48.5, 122, 200, 40, 4, 4, 'FD');

      doc.setFontSize(12);
      doc.setTextColor(168, 162, 158);
      doc.text('TOTAL MATCHES', 73.5, 134, { align: 'center' });
      doc.text('WINS / LOSSES', 148.5, 134, { align: 'center' });
      doc.text('WIN RATE', 223.5, 134, { align: 'center' });

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(243, 241, 238);
      doc.text(totalMatches.toString(), 73.5, 148, { align: 'center' });
      doc.text(`${wins} / ${losses}`, 148.5, 148, { align: 'center' });

      doc.setTextColor(245, 158, 11);
      doc.text(`${winRate}%`, 223.5, 148, { align: 'center' });

      // Footer Signatures
      doc.setDrawColor(72, 68, 64);
      doc.line(60, 185, 110, 185);
      doc.line(187, 185, 237, 185);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 113, 108);
      doc.text('System Administrator', 85, 191, { align: 'center' });
      doc.text(`Generated on ${new Date().toLocaleDateString('en-GB')}`, 212, 191, { align: 'center' });

      doc.save(`Certificate_${playerName.replace(/\s+/g, '_')}_${selectedYear}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="glass-warm w-full max-w-md rounded-2xl p-6 border border-warm-border shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-warm-border">
          <div className="flex items-center gap-2 text-warm-amber font-bold text-lg">
            <Award className="w-5 h-5" />
            <span>Generate Player Certificate</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-warm-subtle hover:text-warm-text hover:bg-warm-border/50 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-warm-muted">
              Select Player
            </label>
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-sm focus:outline-none focus:border-warm-amber transition"
            >
              {players.map((p) => (
                <option key={p.id_player} value={p.id_player}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-warm-muted">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-sm focus:outline-none focus:border-warm-amber transition"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-warm-muted">
                Game
              </label>
              <select
                value={selectedGameId}
                onChange={(e) => setSelectedGameId(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-sm focus:outline-none focus:border-warm-amber transition"
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
        </div>

        <div className="flex gap-3 pt-3 border-t border-warm-border">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-warm-border text-warm-text hover:bg-warm-border/50 text-sm font-medium transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGeneratePDF}
            disabled={generating}
            className="flex-1 py-2.5 rounded-xl bg-warm-amber hover:bg-warm-amberHover text-warm-bg font-semibold text-sm transition shadow-lg shadow-warm-amber/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download size={16} />
            <span>{generating ? 'Generating...' : 'Generate PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
