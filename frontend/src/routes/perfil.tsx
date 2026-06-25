import { useNavigate } from "@/lib/router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import {
  User, Mail, Phone, MapPin, Building2,
  Pencil, X, Check, KeyRound, Eye, EyeOff, LogOut,
} from "lucide-react";

export default function PerfilPage() {
  const { cliente, isAuthenticated, isLoading, logout, refresh } = useAuth();
  const navigate = useNavigate();

  // perfil
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nombre: "", apellido: "", telefono: "", direccion: "", ciudad: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // contraseña
  const [editingPwd, setEditingPwd] = useState(false);
  const [pwd, setPwd] = useState({ actual: "", nueva: "", confirmar: "" });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (cliente) {
      setForm({
        nombre: cliente.nombre ?? "",
        apellido: cliente.apellido ?? "",
        telefono: cliente.telefono ?? "",
        direccion: cliente.direccion ?? "",
        ciudad: cliente.ciudad ?? "",
      });
    }
  }, [cliente]);

  if (isLoading) return <div className="container-x py-20 text-center text-muted-foreground">Cargando...</div>;
  if (!cliente) return null;

  const handleLogout = async () => { await logout(); navigate({ to: "/" }); };

  const saveProfile = async () => {
    setSaving(true); setMsg(null);
    try {
      await authService.updateProfile(form);
      await refresh();
      setEditing(false);
      setMsg({ ok: true, text: "Información actualizada correctamente." });
    } catch (e: any) {
      setMsg({ ok: false, text: e.message || "Error al actualizar." });
    } finally { setSaving(false); }
  };

  const cancelProfile = () => {
    setEditing(false); setMsg(null);
    setForm({ nombre: cliente.nombre ?? "", apellido: cliente.apellido ?? "", telefono: cliente.telefono ?? "", direccion: cliente.direccion ?? "", ciudad: cliente.ciudad ?? "" });
  };

  const savePassword = async () => {
    setPwdMsg(null);
    if (pwd.nueva !== pwd.confirmar) { setPwdMsg({ ok: false, text: "Las contraseñas no coinciden." }); return; }
    if (pwd.nueva.length < 6) { setPwdMsg({ ok: false, text: "Mínimo 6 caracteres." }); return; }
    setPwdSaving(true);
    try {
      await authService.updatePassword({ passwordActual: pwd.actual, passwordNueva: pwd.nueva });
      setPwdMsg({ ok: true, text: "Contraseña actualizada." });
      setEditingPwd(false);
      setPwd({ actual: "", nueva: "", confirmar: "" });
    } catch (e: any) {
      setPwdMsg({ ok: false, text: e.message || "Contraseña actual incorrecta." });
    } finally { setPwdSaving(false); }
  };

  return (
    <div className="container-x py-10 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-brand-blue">Mi Perfil</h1>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-semibold transition-colors">
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </div>

      {/* Avatar + nombre */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 flex items-center gap-5 mb-6">
        <div className="h-20 w-20 shrink-0 bg-brand-blue rounded-full flex items-center justify-center text-white font-black text-2xl select-none">
          {cliente.nombre[0]}{cliente.apellido[0]}
        </div>
        <div>
          <p className="text-2xl font-black text-foreground">{cliente.nombre} {cliente.apellido}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <Mail className="h-3.5 w-3.5" /> {cliente.email}
          </p>
        </div>
      </div>

      {/* Información personal */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <div>
            <p className="font-bold text-foreground">Información personal</p>
            <p className="text-xs text-muted-foreground mt-0.5">Nombre, teléfono, dirección y ciudad</p>
          </div>
          {editing ? (
            <div className="flex items-center gap-3">
              <button onClick={cancelProfile} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" /> Cancelar
              </button>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex items-center gap-1.5 bg-brand-blue text-white text-sm font-bold px-4 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                <Check className="h-4 w-4" /> {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          ) : (
            <button onClick={() => { setEditing(true); setMsg(null); }} className="flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:underline">
              <Pencil className="h-3.5 w-3.5" /> Editar
            </button>
          )}
        </div>

        <div className="p-6">
          {msg && (
            <div className={`mb-5 px-4 py-3 rounded-lg border text-sm ${msg.ok ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
              {msg.text}
            </div>
          )}

          {/* Email readonly */}
          <div className="mb-5">
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              <Mail className="h-3.5 w-3.5 text-brand-blue" /> Correo electrónico
            </label>
            <div className="rounded-lg border bg-slate-50 px-4 py-2.5 text-sm text-muted-foreground">{cliente.email}</div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {([
              { label: "Nombre",    key: "nombre",    Icon: User,      ph: "Tu nombre" },
              { label: "Apellido",  key: "apellido",  Icon: User,      ph: "Tu apellido" },
              { label: "Teléfono",  key: "telefono",  Icon: Phone,     ph: "0999999999" },
              { label: "Ciudad",    key: "ciudad",    Icon: Building2, ph: "Ej: Guayaquil" },
              { label: "Dirección", key: "direccion", Icon: MapPin,    ph: "Calle, número, referencia..." },
            ] as const).map(({ label, key, Icon, ph }) => (
              <div key={key} className={key === "direccion" ? "sm:col-span-2" : ""}>
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  <Icon className="h-3.5 w-3.5 text-brand-blue" /> {label}
                </label>
                {editing ? (
                  <input
                    value={form[key]}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={ph}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 transition"
                  />
                ) : (
                  <div className="rounded-lg border bg-white px-4 py-2.5 text-sm text-foreground min-h-[42px]">
                    {form[key] || <span className="text-muted-foreground italic font-normal">No registrado</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contraseña */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <div>
            <p className="font-bold text-foreground">Contraseña</p>
            <p className="text-xs text-muted-foreground mt-0.5">Cambia tu contraseña de acceso</p>
          </div>
          {editingPwd ? (
            <button onClick={() => { setEditingPwd(false); setPwdMsg(null); setPwd({ actual: "", nueva: "", confirmar: "" }); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" /> Cancelar
            </button>
          ) : (
            <button onClick={() => { setEditingPwd(true); setPwdMsg(null); }} className="flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:underline">
              <KeyRound className="h-3.5 w-3.5" /> Cambiar
            </button>
          )}
        </div>

        {!editingPwd ? (
          <div className="px-6 py-4 flex items-center gap-2 text-muted-foreground">
            <KeyRound className="h-4 w-4" />
            <span className="tracking-widest text-lg leading-none">••••••••••</span>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {pwdMsg && (
              <div className={`px-4 py-3 rounded-lg border text-sm ${pwdMsg.ok ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                {pwdMsg.text}
              </div>
            )}

            {([
              { label: "Contraseña actual",          field: "actual",    show: showActual, toggle: () => setShowActual(v => !v) },
              { label: "Nueva contraseña",            field: "nueva",     show: showNueva,  toggle: () => setShowNueva(v => !v) },
              { label: "Confirmar nueva contraseña",  field: "confirmar", show: showNueva,  toggle: () => setShowNueva(v => !v) },
            ] as const).map(({ label, field, show, toggle }) => (
              <div key={field}>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    value={pwd[field]}
                    onChange={(e) => setPwd(f => ({ ...f, [field]: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-11 text-sm focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 transition"
                  />
                  <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={savePassword}
              disabled={pwdSaving}
              className="w-full bg-brand-blue text-white font-bold py-2.5 rounded-lg text-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {pwdSaving ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
