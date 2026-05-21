"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Card, Badge, Modal } from "@/components/ui";
import { ROLES } from "@/lib/constants";
import type { User, Role } from "@/types";
import type { BadgeColor } from "@/components/ui";

const ROLE_COLORS: Record<Role, BadgeColor> = {
  SUPERADMIN: "red", WORKER: "blue", IMAM: "gold", USER: "gray",
};

interface AccountsManagerProps {
  users: User[];
}

export function AccountsManager({ users }: AccountsManagerProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "WORKER" as "WORKER" | "IMAM" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to create account.");
    } else {
      setCreateOpen(false);
      setForm({ name: "", email: "", password: "", role: "WORKER" });
      router.refresh();
    }
    setLoading(false);
  }

  async function toggleActive(userId: string, isActive: boolean) {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
  }

  const staffUsers = users.filter((u) => u.role !== "USER");
  const communityUsers = users.filter((u) => u.role === "USER");

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>+ Create Staff Account</Button>
      </div>

      {/* Staff */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">Staff ({staffUsers.length})</h3>
        <div className="space-y-2">
          {staffUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{u.name}</p>
                <p className="text-xs text-gray-500">{u.email} · Joined {new Date(u.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={ROLE_COLORS[u.role]}>{ROLES[u.role].label}</Badge>
                {!u.isActive && <Badge color="red">Deactivated</Badge>}
                {u.role !== "SUPERADMIN" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(u.id, u.isActive)}
                    className={u.isActive ? "text-red-600 hover:text-red-700" : "text-green-700 hover:text-green-800"}
                  >
                    {u.isActive ? "Deactivate" : "Reactivate"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Community users */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">Community Members ({communityUsers.length})</h3>
        <div className="space-y-2">
          {communityUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{u.name}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {!u.isActive && <Badge color="red">Deactivated</Badge>}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleActive(u.id, u.isActive)}
                  className={u.isActive ? "text-red-600" : "text-green-700"}
                >
                  {u.isActive ? "Deactivate" : "Reactivate"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Staff Account">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Temporary password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required hint="Min 8 characters. They should change it on first login." />
          <Select
            label="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as "WORKER" | "IMAM" })}
            options={[
              { value: "WORKER", label: "Mosque Worker" },
              { value: "IMAM", label: "Imam" },
            ]}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Create Account</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
