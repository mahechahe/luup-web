import {
  ArrowLeft, Users, Plus, Trash2, UserPlus, Building2, Mail, Eye, EyeOff,
  Sparkles, Recycle, LayoutGrid, Check, FileText, Upload, ExternalLink, Download, Info, Pencil,
  History,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  getEventClientesService,
  createClienteUserService,
  listClienteUsersService,
  assignClienteToEventService,
  removeClienteFromEventService,
  uploadReportService,
  updateEventClienteService,
} from '../../Cliente/services/clienteServices';
import HistoricalEventsDrawer from './HistoricalEventsDrawer';

const SERVICE_OPTIONS = [
  {
    value: 'aseo',
    label: 'Aseo',
    icon: Sparkles,
    description: 'Limpieza y aseo del recinto durante el evento.',
    includes: ['Limpieza de zonas comunes', 'Retiro de basura general', 'Mantenimiento de baños'],
    border: 'border-blue-500',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badgeBg: 'bg-blue-500',
  },
  {
    value: 'residuos',
    label: 'Residuos',
    icon: Recycle,
    description: 'Gestión, separación y trazabilidad de residuos reciclables.',
    includes: ['Separación en la fuente', 'Registro de kg por tipo', 'Trazabilidad de reciclaje'],
    border: 'border-emerald-500',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-500',
  },
  {
    value: 'integral',
    label: 'Integral',
    icon: LayoutGrid,
    description: 'Servicio completo: aseo + gestión de residuos en un solo contrato.',
    includes: ['Todo lo de Aseo', 'Todo lo de Residuos', 'Informe consolidado único'],
    border: 'border-purple-500',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    badgeBg: 'bg-purple-500',
  },
];

const SERVICE_COLOR = {
  aseo:     'bg-blue-50 text-blue-700 border-blue-200',
  residuos: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  integral: 'bg-purple-50 text-purple-700 border-purple-200',
};

const SERVICE_LABEL = {
  aseo: 'Aseo',
  residuos: 'Residuos',
  integral: 'Integral',
};

function ServiceTypePicker({ value, onChange }) {
  return (
    <div className="space-y-2">
      {SERVICE_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`w-full text-left rounded-xl border-2 p-3.5 bg-card transition-all ${
              selected ? opt.border : 'border-border hover:border-muted-foreground/40'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                selected ? opt.iconBg : 'bg-muted'
              }`}>
                <Icon className={`w-4 h-4 transition-colors ${selected ? opt.iconColor : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-foreground">{opt.label}</p>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    selected ? `${opt.badgeBg} border-transparent` : 'border-muted-foreground/30 bg-transparent'
                  }`}>
                    {selected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                <ul className="mt-2 space-y-0.5">
                  {opt.includes.map((item) => (
                    <li key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Drawer: Asignar cliente existente ─────────────────────────────────────────

function AssignExistingDrawer({ open, onClose, eventId, onSuccess, assignedUserIds }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedUserId('');
    setServiceType('');
    setLoadingUsers(true);
    listClienteUsersService().then((res) => {
      if (res.status) setUsers(res.users.filter((u) => !assignedUserIds.includes(u.userId)));
      else toast.error(res.errors ?? 'Error al cargar los clientes.');
      setLoadingUsers(false);
    });
  }, [open]);

  const handleAssign = async () => {
    if (!selectedUserId || !serviceType) {
      toast.error('Selecciona un cliente y un tipo de servicio.');
      return;
    }
    setSaving(true);
    const res = await assignClienteToEventService(eventId, {
      userId: Number(selectedUserId),
      serviceType,
    });
    if (res.status) {
      toast.success('Cliente asignado exitosamente.');
      onSuccess();
      onClose();
    } else {
      toast.error(res.errors ?? 'Error al asignar el cliente.');
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90dvh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <DialogTitle>Asignar Cliente Existente</DialogTitle>
          <DialogDescription>Selecciona un cliente ya creado y asígnalo a este evento.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Selector de cliente */}
          <div className="space-y-2">
            <Label>Cliente</Label>
            {loadingUsers ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 border border-border rounded-xl">
                {assignedUserIds.length > 0
                  ? 'Todos los clientes ya están asignados a este evento.'
                  : 'No hay clientes creados aún.'}
              </p>
            ) : (
              <div className="space-y-2">
                {users.map((u) => {
                  const selected = selectedUserId === String(u.userId);
                  return (
                    <button
                      key={u.userId}
                      type="button"
                      onClick={() => setSelectedUserId(String(u.userId))}
                      className={`w-full text-left rounded-xl border-2 px-3.5 py-3 bg-card transition-all ${
                        selected ? 'border-brand' : 'border-border hover:border-muted-foreground/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm transition-colors ${
                          selected ? 'bg-brand/15 text-brand' : 'bg-muted text-muted-foreground'
                        }`}>
                          {u.firstName?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {u.firstName} {u.lastName}
                            {u.companyName && <span className="font-normal text-muted-foreground ml-1.5">· {u.companyName}</span>}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          selected ? 'bg-brand border-transparent' : 'border-muted-foreground/30'
                        }`}>
                          {selected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tipo de servicio */}
          <div className="space-y-2">
            <Label>Tipo de servicio</Label>
            <ServiceTypePicker value={serviceType} onChange={setServiceType} />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex justify-end gap-2 shrink-0">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleAssign} disabled={saving || !selectedUserId || !serviceType}>
            {saving ? 'Asignando...' : 'Asignar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Drawer: Crear nuevo cliente ──────────────────────────────────────────────

function CreateClientDrawer({ open, onClose, eventId, onSuccess, client = null }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', companyName: '', serviceType: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const editing = !!client;

  useEffect(() => {
    if (!open) return;
    setShowPwd(false);
    setForm(client ? {
      firstName: client.user.firstName ?? '',
      lastName: client.user.lastName ?? '',
      email: client.user.email ?? '',
      password: '',
      companyName: client.user.companyName ?? '',
      serviceType: client.serviceType ?? '',
    } : { firstName: '', lastName: '', email: '', password: '', companyName: '', serviceType: '' });
  }, [client, open]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setSelect = (field) => (v) => setForm((f) => ({ ...f, [field]: v }));

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName || !form.email || (!editing && !form.password) || !form.serviceType) {
      toast.error('Completa todos los campos obligatorios.');
      return;
    }
    setSaving(true);

    if (editing) {
      const updateRes = await updateEventClienteService(eventId, client.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        ...(form.password ? { password: form.password } : {}),
        companyName: form.companyName,
        serviceType: form.serviceType,
      });
      if (updateRes.status) {
        toast.success('Cliente actualizado exitosamente.');
        onSuccess();
        onClose();
      } else {
        toast.error(updateRes.errors ?? 'Error al actualizar el cliente.');
      }
      setSaving(false);
      return;
    }

    const createRes = await createClienteUserService({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
      companyName: form.companyName || undefined,
    });
    if (!createRes.status) {
      toast.error(createRes.errors ?? 'Error al crear el usuario cliente.');
      setSaving(false);
      return;
    }
    const assignRes = await assignClienteToEventService(eventId, {
      userId: createRes.user.userId,
      serviceType: form.serviceType,
    });
    if (assignRes.status) {
      toast.success('Cliente creado y asignado exitosamente.');
      onSuccess();
      onClose();
      setForm({ firstName: '', lastName: '', email: '', password: '', companyName: '', serviceType: '' });
    } else {
      toast.error(assignRes.errors ?? 'Usuario creado pero no se pudo asignar al evento.');
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90dvh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <DialogTitle>{editing ? 'Editar cliente' : 'Crear nuevo cliente'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Actualiza los datos del cliente y su servicio para este evento.'
              : 'Crea un usuario cliente y asígnalo automáticamente a este evento.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nombre <span className="text-destructive">*</span></Label>
              <Input placeholder="Juan" value={form.firstName} onChange={set('firstName')} />
            </div>
            <div className="space-y-1.5">
              <Label>Apellido <span className="text-destructive">*</span></Label>
              <Input placeholder="Pérez" value={form.lastName} onChange={set('lastName')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" type="email" placeholder="cliente@empresa.com" value={form.email} onChange={set('email')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>
              Contraseña {!editing && <span className="text-destructive">*</span>}
            </Label>
            <div className="relative">
              <Input
                type={showPwd ? 'text' : 'password'}
                placeholder={editing ? 'Déjala vacía para conservar la actual' : 'Mínimo 6 caracteres'}
                value={form.password}
                onChange={set('password')}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {editing && (
              <p className="text-xs text-muted-foreground">
                La contraseña actual se conservará si no escribes una nueva.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Empresa / Organización</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Opcional" value={form.companyName} onChange={set('companyName')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de servicio <span className="text-destructive">*</span></Label>
            <ServiceTypePicker value={form.serviceType} onChange={setSelect('serviceType')} />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-border flex justify-end gap-2 shrink-0">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? (editing ? 'Guardando...' : 'Creando...') : (editing ? 'Guardar cambios' : 'Crear y asignar')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Dialog: Asignar informe ───────────────────────────────────────────────────

function ReportUploadDialog({ open, onClose, eventId, client, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setFile(null);
  }, [open]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const res = await uploadReportService(eventId, client.id, file);
    if (res.status) {
      toast.success('Informe subido correctamente.');
      onSuccess();
      onClose();
    } else {
      toast.error(res.errors ?? 'Error al subir el informe.');
    }
    setUploading(false);
  };

  const hasExisting = !!client?.reportUrl;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle>{hasExisting ? 'Reemplazar informe final' : 'Subir informe final'}</DialogTitle>
          <DialogDescription>
            {client && <span>Cliente: <strong>{client.user.firstName} {client.user.lastName}</strong></span>}
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 py-5 space-y-4">
          <div className="relative flex gap-3 overflow-hidden rounded-xl border border-brand/25 bg-brand/5 px-3.5 py-3 text-foreground before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-brand">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10">
              <Info className="h-4 w-4 text-brand" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold">Este informe será visible para el cliente</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Al subirlo, el cliente tendrá acceso al informe desde su portal del evento.
              </p>
            </div>
          </div>

          {hasExisting && (
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-700 font-medium">Informe ya asignado. Subir uno nuevo lo reemplazará.</p>
              </div>
              <a
                href={client.reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 shrink-0 underline"
              >
                Ver <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Drop zone */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`w-full rounded-xl border-2 border-dashed px-4 py-8 flex flex-col items-center gap-2 transition-colors ${
              file
                ? 'border-brand/40 bg-brand/5'
                : 'border-border hover:border-brand/40 hover:bg-muted/50'
            }`}
          >
            {file ? (
              <>
                <FileText className="w-8 h-8 text-brand" />
                <p className="text-sm font-semibold text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <span className="text-xs text-brand underline">Cambiar archivo</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Seleccionar PDF</p>
                <p className="text-xs text-muted-foreground">Haz clic para buscar el archivo</p>
              </>
            )}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={uploading}>Cancelar</Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? 'Subiendo...' : 'Subir informe'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Vista principal ───────────────────────────────────────────────────────────

function EventoClientesPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [toRemove, setToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [reportClient, setReportClient] = useState(null);
  const [historicalClient, setHistoricalClient] = useState(null);
  const [editClient, setEditClient] = useState(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const res = await getEventClientesService(eventId);
    if (res.status) setClients(res.clients);
    else toast.error(res.errors ?? 'Error al cargar los clientes.');
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleRemove = async () => {
    if (!toRemove) return;
    setRemoving(true);
    const res = await removeClienteFromEventService(eventId, toRemove.id);
    if (res.status) {
      toast.success('Cliente removido del evento.');
      fetchClients();
    } else {
      toast.error(res.errors ?? 'Error al remover el cliente.');
    }
    setRemoving(false);
    setToRemove(null);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">

        <button
          type="button"
          onClick={() => navigate(`/eventos/${eventId}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-brand transition-colors group -ml-1"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Volver al evento
        </button>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-600/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-teal-700" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">Clientes del evento</h2>
            </div>
            <p className="text-sm text-muted-foreground">Gestiona quién puede visualizar la información de este evento.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAssign(true)} className="gap-1.5">
              <UserPlus className="w-4 h-4" /> Asignar existente
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
              <Plus className="w-4 h-4" /> Nuevo cliente
            </Button>
          </div>
        </div>

        <div className="relative flex gap-3 overflow-hidden rounded-xl border border-brand/25 bg-card px-4 py-3.5 text-foreground shadow-sm before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-brand">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10">
            <Info className="h-4 w-4 text-brand" />
          </div>
          <div>
            <p className="text-sm font-semibold">Los clientes tendrán acceso al informe</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Cuando subas un informe, quedará disponible para que el cliente lo consulte desde su portal del evento.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Subheader con conteo */}
          <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {loading ? 'Cargando...' : `${clients.length} cliente${clients.length !== 1 ? 's' : ''} asignado${clients.length !== 1 ? 's' : ''}`}
            </p>
            <span className="hidden text-[11px] font-medium text-muted-foreground/70 sm:inline">
              Gestión y acceso al informe
            </span>
          </div>

          {loading ? (
            <div className="divide-y divide-border">
              {[1, 2].map((i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-muted rounded w-36" />
                    <div className="h-3 bg-muted rounded w-48" />
                  </div>
                  <div className="w-14 h-5 bg-muted rounded-full" />
                </div>
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground text-sm">Sin clientes asignados</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Crea un cliente nuevo o asigna uno existente para que pueda ver la información de este evento.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {clients.map((c) => (
                <div
                  key={c.id}
                  className="grid gap-3 px-4 py-4 transition-colors hover:bg-muted/20 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-500/15 bg-teal-500/10 shadow-sm">
                      <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                        {c.user.firstName?.[0]?.toUpperCase() ?? '?'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-semibold leading-tight text-foreground">
                          {c.user.firstName} {c.user.lastName}
                        </p>
                        <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${SERVICE_COLOR[c.serviceType] ?? ''}`}>
                          {SERVICE_LABEL[c.serviceType] ?? c.serviceType}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {c.user.email}
                        {c.user.companyName && <span> · {c.user.companyName}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3 sm:border-0 sm:pt-0">
                    {c.reportUrl && (
                      <a
                        href={c.reportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        aria-label={`Descargar informe de ${c.user.firstName} ${c.user.lastName}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Descargar informe
                      </a>
                    )}
                    <button
                      type="button"
                      aria-label={`${c.reportUrl ? 'Reemplazar' : 'Subir'} informe de ${c.user.firstName} ${c.user.lastName}`}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors ${
                        c.reportUrl
                          ? 'border border-brand/20 bg-brand/10 text-brand hover:bg-brand/20'
                          : 'bg-brand text-white shadow-sm hover:bg-brand/90'
                      }`}
                      onClick={() => setReportClient(c)}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {c.reportUrl ? 'Reemplazar informe' : 'Subir informe'}
                    </button>
                    <button
                      type="button"
                      aria-label={`Remover a ${c.user.firstName} ${c.user.lastName} del evento`}
                      title="Remover del evento"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setToRemove(c)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Eventos históricos de ${c.user.firstName} ${c.user.lastName}`}
                      title="Eventos anteriores a Luup"
                      onClick={() => setHistoricalClient(c)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:border-brand/30 hover:bg-brand/10 hover:text-brand"
                    >
                      <History className="h-3.5 w-3.5" />
                      Históricos
                    </button>
                    <button
                      type="button"
                      aria-label={`Editar a ${c.user.firstName} ${c.user.lastName}`}
                      onClick={() => setEditClient(c)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:border-brand/30 hover:bg-brand/10 hover:text-brand"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateClientDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        eventId={eventId}
        onSuccess={fetchClients}
      />

      <CreateClientDrawer
        open={!!editClient}
        onClose={() => setEditClient(null)}
        eventId={eventId}
        onSuccess={fetchClients}
        client={editClient}
      />

      <AssignExistingDrawer
        open={showAssign}
        onClose={() => setShowAssign(false)}
        eventId={eventId}
        onSuccess={fetchClients}
        assignedUserIds={clients.map((c) => c.user.userId)}
      />

      <ReportUploadDialog
        open={!!reportClient}
        onClose={() => setReportClient(null)}
        eventId={eventId}
        client={reportClient}
        onSuccess={fetchClients}
      />

      <HistoricalEventsDrawer
        open={!!historicalClient}
        onClose={() => setHistoricalClient(null)}
        client={historicalClient}
      />

      <AlertDialog open={!!toRemove} onOpenChange={(v) => !v && setToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Remover cliente del evento?</AlertDialogTitle>
            <AlertDialogDescription>
              {toRemove && (
                <>
                  <strong>{toRemove.user.firstName} {toRemove.user.lastName}</strong> perderá acceso a la información de este evento.
                  Su cuenta de usuario no se eliminará.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? 'Removiendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default EventoClientesPage;
