'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { fetchData, insertData, updateData, deleteData, generateSequentialId } from '@/lib/api';
import { MapPin, Plus, Edit2, Trash2, Search, X } from 'lucide-react';

export default function PlacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [editPlace, setEditPlace] = useState<any>(null);
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
    loadPlaces();
  }, [router]);

  const loadPlaces = async () => {
    setLoading(true);
    try {
      const data = await fetchData('Place');
      setPlaces(data);
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
      const nextId = await generateSequentialId('Place', 'PLC_');
      const newP = {
        id_place: nextId,
        name: name,
        date: date || new Date().toISOString().split('T')[0],
      };
      await insertData('Place', newP);
      setShowAddModal(false);
      setName('');
      setDate('');
      loadPlaces();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPlace) return;
    setSubmitting(true);
    try {
      await updateData('Place', editPlace.id_place, {
        name: editPlace.name,
        date: editPlace.date,
      });
      setShowEditModal(false);
      setEditPlace(null);
      loadPlaces();
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
      await deleteData('Place', deleteTargetId);
      setShowDeleteModal(false);
      setDeleteTargetId('');
      loadPlaces();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPlaces = places.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id_place.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-warm-bg">
      <Sidebar />

      <main className="lg:pl-64 pt-24 lg:pt-24 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pb-2 border-b border-warm-border/60">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-warm-text tracking-tight flex items-center gap-2">
              <MapPin className="w-6 h-6 text-warm-amber" /> Place Management
            </h1>
            <p className="text-xs sm:text-sm text-warm-muted">
              Manage all game locations and places.
            </p>
          </div>

          <button
            onClick={() => {
              setDate(new Date().toISOString().split('T')[0]);
              setShowAddModal(true);
            }}
            className="py-2.5 px-4 rounded-xl bg-warm-amber hover:bg-warm-amberHover text-warm-bg font-semibold text-sm transition shadow-lg shadow-warm-amber/15 flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            <span>Add Place</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-subtle w-4 h-4" />
            <input
              type="text"
              placeholder="Search place name or ID..."
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
                  <th className="py-3.5 px-4 font-semibold">ID Place</th>
                  <th className="py-3.5 px-4 font-semibold">Place Name</th>
                  <th className="py-3.5 px-4 font-semibold">Date Added</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-border/40">
                {filteredPlaces.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-warm-muted text-sm">
                      No places found
                    </td>
                  </tr>
                ) : (
                  filteredPlaces.map((p) => (
                    <tr key={p.id_place} className="hover:bg-warm-cardHover/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-warm-amber text-xs">
                        {p.id_place}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-warm-text">{p.name}</td>
                      <td className="py-3.5 px-4 text-warm-muted text-xs">{p.date || '-'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditPlace({ ...p });
                              setShowEditModal(true);
                            }}
                            className="p-1.5 rounded-lg border border-warm-border text-warm-amber hover:bg-warm-amber/10 transition"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTargetId(p.id_place);
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
              <h3 className="font-bold text-warm-text text-lg">Add New Place</h3>
              <button onClick={() => setShowAddModal(false)} className="text-warm-subtle hover:text-warm-text">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-warm-muted block mb-1">Place Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter place location name"
                  className="w-full py-2.5 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-sm focus:outline-none focus:border-warm-amber"
                />
              </div>
              <div>
                <label className="text-xs text-warm-muted block mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
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
                  {submitting ? 'Saving...' : 'Save Place'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-warm w-full max-w-md rounded-2xl p-6 border border-warm-border shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-warm-border">
              <h3 className="font-bold text-warm-text text-lg">Edit Place ({editPlace.id_place})</h3>
              <button onClick={() => setShowEditModal(false)} className="text-warm-subtle hover:text-warm-text">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-warm-muted block mb-1">Place Name</label>
                <input
                  type="text"
                  required
                  value={editPlace.name}
                  onChange={(e) => setEditPlace({ ...editPlace, name: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl bg-warm-bg border border-warm-border text-warm-text text-sm focus:outline-none focus:border-warm-amber"
                />
              </div>
              <div>
                <label className="text-xs text-warm-muted block mb-1">Date</label>
                <input
                  type="date"
                  value={editPlace.date || ''}
                  onChange={(e) => setEditPlace({ ...editPlace, date: e.target.value })}
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
                  {submitting ? 'Updating...' : 'Update Place'}
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
            <h3 className="text-lg font-bold text-warm-text">Delete Place</h3>
            <p className="text-sm text-warm-muted">
              Are you sure you want to delete place <span className="text-warm-amber font-semibold">{deleteTargetId}</span>?
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
