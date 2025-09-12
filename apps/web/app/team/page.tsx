"use client";

import { useEffect, useState } from "react";

type Member = { 
  id: string; 
  displayName?: string; 
  email?: string; 
  role?: string;
  joinedAt?: number;
  updatedAt?: number;
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState("member");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/team/bulk-roles?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load members");
      setMembers(data.members || []);
      setFilteredMembers(data.members || []);
    } catch (e: any) {
      setError(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [roleFilter, search]);

  useEffect(() => {
    let filtered = members;
    if (search) {
      filtered = members.filter(m => 
        m.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase()) ||
        m.id.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredMembers(filtered);
  }, [members, search]);

  async function setRole(id: string, role: string) {
    setUpdating(prev => new Set(prev).add(id));
    try {
      const res = await fetch("/api/team/roles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: id, role }),
      });
      if (!res.ok) throw new Error("Not authorized or invalid");
      
      // Optimistic update
      setMembers(prev => prev.map(m => m.id === id ? { ...m, role, updatedAt: Date.now() } : m));
      setFilteredMembers(prev => prev.map(m => m.id === id ? { ...m, role, updatedAt: Date.now() } : m));
    } catch (e: any) {
      alert(e.message || "Failed to update role");
    } finally {
      setUpdating(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function bulkUpdateRoles() {
    if (selectedMembers.size === 0) return;
    
    const userIds = Array.from(selectedMembers);
    setError(null);
    
    try {
      const res = await fetch("/api/team/bulk-roles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userIds, role: bulkRole }),
      });
      
      if (!res.ok) throw new Error("Not authorized or invalid");
      
      // Optimistic update
      setMembers(prev => prev.map(m => 
        selectedMembers.has(m.id) ? { ...m, role: bulkRole, updatedAt: Date.now() } : m
      ));
      setFilteredMembers(prev => prev.map(m => 
        selectedMembers.has(m.id) ? { ...m, role: bulkRole, updatedAt: Date.now() } : m
      ));
      setSelectedMembers(new Set());
    } catch (e: any) {
      setError(e.message || "Failed to bulk update");
    }
  }

  function toggleMemberSelection(id: string) {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllSelection() {
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredMembers.map(m => m.id)));
    }
  }

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "owner": return { bg: "#fef3c7", text: "#92400e", border: "#f59e0b" };
      case "admin": return { bg: "#dbeafe", text: "#1e40af", border: "#3b82f6" };
      case "member": return { bg: "#dcfce7", text: "#166534", border: "#22c55e" };
      case "staff": return { bg: "#f3e8ff", text: "#7c3aed", border: "#a855f7" };
      case "viewer": return { bg: "#f1f5f9", text: "#475569", border: "#64748b" };
      default: return { bg: "#f3f4f6", text: "#374151", border: "#9ca3af" };
    }
  };

  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Team Management</h1>
        <div style={{ fontSize: 14, color: "#6b7280" }}>
          {members.length} member{members.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr auto auto", 
        gap: 12, 
        marginBottom: 24,
        padding: 16,
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 8
      }}>
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 14
          }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 14,
            backgroundColor: "white"
          }}
        >
          <option value="all">All Roles</option>
          <option value="owner">Owners</option>
          <option value="admin">Admins</option>
          <option value="member">Members</option>
          <option value="staff">Staff</option>
          <option value="viewer">Viewers</option>
        </select>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "8px 16px",
            backgroundColor: "#f3f4f6",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 14,
            cursor: "pointer"
          }}
        >
          Refresh
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedMembers.size > 0 && (
        <div style={{
          padding: 16,
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: 8,
          marginBottom: 16
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {selectedMembers.size} member{selectedMembers.size !== 1 ? "s" : ""} selected
            </span>
            <select
              value={bulkRole}
              onChange={(e) => setBulkRole(e.target.value)}
              style={{
                padding: "6px 10px",
                border: "1px solid #d1d5db",
                borderRadius: 4,
                fontSize: 14,
                backgroundColor: "white"
              }}
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              onClick={bulkUpdateRoles}
              style={{
                padding: "6px 12px",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: 4,
                fontSize: 14,
                cursor: "pointer"
              }}
            >
              Update Roles
            </button>
            <button
              onClick={() => setSelectedMembers(new Set())}
              style={{
                padding: "6px 12px",
                backgroundColor: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: 4,
                fontSize: 14,
                cursor: "pointer"
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: 32, color: "#6b7280" }}>
          Loading members...
        </div>
      )}

      {error && (
        <div style={{ 
          color: "#dc2626", 
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          padding: 12,
          borderRadius: 8,
          marginBottom: 16
        }}>
          {error}
        </div>
      )}

      {/* Members Table */}
      {!loading && (
        <div style={{ 
          backgroundColor: "white", 
          border: "1px solid #e5e7eb", 
          borderRadius: 8,
          overflow: "hidden"
        }}>
          {/* Table Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "40px 1fr auto auto auto",
            gap: 16,
            padding: "12px 16px",
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            fontSize: 12,
            fontWeight: 600,
            color: "#374151",
            textTransform: "uppercase",
            letterSpacing: 0.5
          }}>
            <input
              type="checkbox"
              checked={selectedMembers.size === filteredMembers.length && filteredMembers.length > 0}
              onChange={toggleAllSelection}
            />
            <div>Member</div>
            <div>Role</div>
            <div>Joined</div>
            <div>Actions</div>
          </div>

          {/* Table Body */}
          <div>
            {filteredMembers.map(m => {
              const colors = getRoleBadgeColor(m.role);
              return (
                <div key={m.id} style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1fr auto auto auto",
                  gap: 16,
                  padding: "12px 16px",
                  borderBottom: "1px solid #f3f4f6",
                  alignItems: "center"
                }}>
                  <input
                    type="checkbox"
                    checked={selectedMembers.has(m.id)}
                    onChange={() => toggleMemberSelection(m.id)}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {m.displayName || m.email || m.id}
                    </div>
                    <div style={{ color: "#6b7280", fontSize: 12 }}>
                      {m.email}
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 12,
                    padding: "4px 8px",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    display: "inline-block"
                  }}>
                    {m.role || "member"}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "—"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <select 
                      value={m.role || "member"} 
                      onChange={(e) => setRole(m.id, e.target.value)}
                      disabled={updating.has(m.id)}
                      style={{
                        padding: "4px 8px",
                        border: "1px solid #d1d5db",
                        borderRadius: 4,
                        fontSize: 12,
                        backgroundColor: "white",
                        opacity: updating.has(m.id) ? 0.5 : 1
                      }}
                    >
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="staff">Staff</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    {updating.has(m.id) && (
                      <div style={{
                        width: 12,
                        height: 12,
                        border: "2px solid #e5e7eb",
                        borderTop: "2px solid #2563eb",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                      }} />
                    )}
                  </div>
                </div>
              );
            })}
            {filteredMembers.length === 0 && !loading && (
              <div style={{ 
                textAlign: "center", 
                padding: 32, 
                color: "#6b7280" 
              }}>
                {search || roleFilter !== "all" ? "No members match your filters." : "No members yet."}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
