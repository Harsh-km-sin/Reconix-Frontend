import { useEffect, useMemo, useState } from 'react';
import { Shield, Plus, Trash2, Loader2, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { roleService } from '@/modules/rbac/services/roleService';
import type { PermissionDef, RoleWithPermissions, RolesPageMode } from '@/modules/rbac/types';

export function RolesPermissions() {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [catalog, setCatalog] = useState<PermissionDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<RolesPageMode>({ kind: 'empty' });

  // Editor draft
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const selectedRole = mode.kind === 'view' ? roles.find((r) => r.id === mode.roleId) ?? null : null;
  const isSystem = selectedRole?.isSystem ?? false;

  const groupedCatalog = useMemo(() => {
    const groups: Record<string, PermissionDef[]> = {};
    for (const p of catalog) {
      const cat = p.category || 'other';
      (groups[cat] ??= []).push(p);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [catalog]);

  const load = async () => {
    setLoading(true);
    try {
      const [r, c] = await Promise.all([roleService.listRoles(), roleService.listPermissions()]);
      setRoles(r);
      setCatalog(c);
    } catch {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openRole = (role: RoleWithPermissions) => {
    setMode({ kind: 'view', roleId: role.id });
    setName(role.name);
    setDescription(role.description ?? '');
    setSelectedKeys(new Set(role.permissionKeys));
  };

  const openCreate = () => {
    setMode({ kind: 'create' });
    setName('');
    setDescription('');
    setSelectedKeys(new Set());
  };

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleCategory = (perms: PermissionDef[], on: boolean) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      perms.forEach((p) => (on ? next.add(p.key) : next.delete(p.key)));
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Role name is required');
      return;
    }
    setSaving(true);
    try {
      const keys = Array.from(selectedKeys);
      if (mode.kind === 'create') {
        const created = await roleService.createRole({ name: name.trim(), description: description.trim() || undefined, permissionKeys: keys });
        toast.success('Role created');
        await load();
        openRole(created);
      } else if (mode.kind === 'view') {
        if (!isSystem && (name.trim() !== selectedRole?.name || description.trim() !== (selectedRole?.description ?? ''))) {
          await roleService.updateRole(mode.roleId, { name: name.trim(), description: description.trim() });
        }
        await roleService.setRolePermissions(mode.roleId, keys);
        toast.success('Role updated');
        await load();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (mode.kind !== 'view' || isSystem) return;
    if (!confirm(`Delete role "${selectedRole?.name}"? This cannot be undone.`)) return;
    try {
      await roleService.deleteRole(mode.roleId);
      toast.success('Role deleted');
      setMode({ kind: 'empty' });
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete role');
    }
  };

  const editing = mode.kind === 'view' || mode.kind === 'create';

  return (
    <div className="max-w-[1100px] mx-auto p-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center">
          <Shield className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">Roles &amp; Permissions</h1>
          <p className="text-sm text-ink-mid">Create roles and choose exactly what each one can do.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-ink-light">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 mt-6">
          {/* Roles list */}
          <div className="bg-surface border border-line rounded-xl p-3 h-fit">
            <button
              onClick={openCreate}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 mb-2 bg-brand text-white rounded-md text-sm font-semibold hover:bg-brand-hover transition-colors"
            >
              <Plus className="w-4 h-4" /> New Role
            </button>
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => openRole(r)}
                className={`w-full text-left px-3 py-2.5 rounded-md mb-1 transition-colors ${
                  mode.kind === 'view' && mode.roleId === r.id ? 'bg-brand-light text-brand-hover' : 'hover:bg-line-light text-ink'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{r.name}</span>
                  {r.isSystem && <Lock className="w-3.5 h-3.5 text-ink-light" />}
                </div>
                <div className="text-xs text-ink-light">{r.permissionKeys.length} permissions</div>
              </button>
            ))}
          </div>

          {/* Editor */}
          <div className="bg-surface border border-line rounded-xl p-6">
            {!editing ? (
              <div className="text-center py-20 text-ink-light">
                Select a role to edit, or create a new one.
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-ink-mid mb-1">Role name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSystem}
                      placeholder="e.g. Job Creator"
                      className="w-full h-10 px-3 border border-line rounded-md text-sm focus:border-brand focus:outline-none disabled:bg-line-light disabled:text-ink-light"
                    />
                    {isSystem && <p className="text-xs text-ink-light mt-1">System role — name is locked, but permissions are editable.</p>}
                  </div>
                  {mode.kind === 'view' && !isSystem && (
                    <button onClick={handleDelete} className="mt-6 p-2 text-danger hover:bg-[#FDECEA] rounded-md transition-colors" title="Delete role">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-semibold text-ink-mid mb-1">Description</label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSystem}
                    placeholder="What is this role for?"
                    className="w-full h-10 px-3 border border-line rounded-md text-sm focus:border-brand focus:outline-none disabled:bg-line-light disabled:text-ink-light"
                  />
                </div>

                <div className="space-y-5">
                  {groupedCatalog.map(([category, perms]) => {
                    const allOn = perms.every((p) => selectedKeys.has(p.key));
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-bold text-ink capitalize">{category}</h3>
                          <button onClick={() => toggleCategory(perms, !allOn)} className="text-xs text-brand hover:underline">
                            {allOn ? 'Clear all' : 'Select all'}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {perms.map((p) => (
                            <label key={p.key} className="flex items-start gap-2.5 p-2.5 border border-[#EEEEEE] rounded-md hover:bg-page cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedKeys.has(p.key)}
                                onChange={() => toggleKey(p.key)}
                                className="mt-0.5 w-4 h-4 accent-brand"
                              />
                              <div>
                                <div className="text-sm text-ink font-medium">{p.key}</div>
                                {p.description && <div className="text-xs text-ink-light">{p.description}</div>}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-[#EEEEEE]">
                  <button onClick={() => setMode({ kind: 'empty' })} className="px-5 py-2.5 border border-line text-ink-mid rounded-md text-sm font-medium hover:bg-line-light">
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-md text-sm font-semibold hover:bg-brand-hover disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {mode.kind === 'create' ? 'Create Role' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
