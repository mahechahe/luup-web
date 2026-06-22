import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Camera,
  FileImage,
  IdCard,
  ImageIcon,
  Mail,
  Phone,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useUserStore } from '@/App/context/userStore';
import {
  getOwnCollaboratorProfileService,
  updateOwnCollaboratorPhotoService,
} from '@/App/routes/Colaboradores/services/collaboratorServices';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function initialsFor(profile) {
  return `${profile?.firstName?.[0] ?? ''}${
    profile?.lastName?.[0] ?? ''
  }`.toUpperCase();
}

function ProfileAvatar({ profile }) {
  return (
    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[1.75rem] border-4 border-background bg-brand text-3xl font-bold text-white shadow-xl">
      {initialsFor(profile) || <UserRound className="h-7 w-7" />}
      {profile?.photoUrl && (
        <img
          src={profile.photoUrl}
          alt={`Foto de ${profile.firstName}`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}

function EditableProfileAvatar({ profile, onCamera, onGallery }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <ProfileAvatar profile={profile} />
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background shadow-md transition-colors hover:bg-muted"
            title="Cambiar foto"
            aria-label="Cambiar mi foto de perfil"
          >
            <Camera className="h-4 w-4 text-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          className="w-48 overflow-hidden rounded-xl p-0 shadow-xl"
        >
          <button
            type="button"
            onClick={() => {
              onCamera();
              setMenuOpen(false);
            }}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-muted"
          >
            <Camera className="h-4 w-4 text-muted-foreground" />
            Tomar foto
          </button>
          <div className="mx-3 h-px bg-border" />
          <button
            type="button"
            onClick={() => {
              onGallery();
              setMenuOpen(false);
            }}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-muted"
          >
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            Cargar imagen
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function PhotoPreviewModal({ preview, uploading, error, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">
            Confirmar foto
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-muted disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="aspect-square overflow-hidden rounded-xl bg-muted ring-1 ring-border">
            <img
              src={preview.previewUrl}
              alt="Vista previa de la foto"
              className="h-full w-full object-cover"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
              <p className="text-xs font-medium text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2.5">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1 gap-2"
              onClick={onConfirm}
              disabled={uploading}
            >
              {uploading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? 'Subiendo…' : 'Subir foto'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-background/60 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
        <Icon className="h-4 w-4 text-brand" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">
          {value || 'No registrado'}
        </p>
      </div>
    </div>
  );
}

export default function MiPerfilPage() {
  const { user, setUser } = useUserStore();
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const previewRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    getOwnCollaboratorProfileService().then((result) => {
      if (result.status) setProfile(result.profile);
      else toast.error(result.errors);
      setLoading(false);
    });
  }, []);

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    []
  );

  const clearPreview = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setPhotoPreview(null);
    setUploadError(null);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Selecciona una imagen JPG, PNG o WebP.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('La imagen no puede superar los 5 MB.');
      return;
    }

    clearPreview();
    const previewUrl = URL.createObjectURL(file);
    previewRef.current = previewUrl;
    setPhotoPreview({ file, previewUrl });
  };

  const handleConfirm = async () => {
    if (!photoPreview) return;
    setUploading(true);
    setUploadError(null);

    const result = await updateOwnCollaboratorPhotoService(photoPreview.file);
    if (result.status) {
      setProfile((current) => ({ ...current, photoUrl: result.photoUrl }));
      setUser({ ...user, photoUrl: result.photoUrl });
      clearPreview();
      toast.success('Tu foto de perfil fue actualizada.');
    } else {
      setUploadError(result.errors || 'No fue posible subir la foto.');
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
        <div className="h-64 animate-pulse rounded-3xl bg-muted" />
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="px-4 py-16 text-center text-sm text-muted-foreground">
        No fue posible cargar tu perfil.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-[#234465] via-[#234465]/90 to-[#DD7419]/70" />
          <div
            className="absolute inset-x-0 top-0 h-32 opacity-15"
            style={{
              backgroundImage:
                'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }}
          />
          <div className="relative px-5 pb-6 pt-16 sm:px-8">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end">
              <EditableProfileAvatar
                profile={profile}
                onCamera={() => cameraInputRef.current?.click()}
                onGallery={() => galleryInputRef.current?.click()}
              />
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <BadgeCheck className="h-3.5 w-3.5" /> Activo
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {profile.roleName || 'Colaborador LUUP'}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Usa el botón de cámara sobre tu foto para cambiarla.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <FileImage className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-semibold text-foreground">
              Información de tu perfil
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoItem
              icon={IdCard}
              label="Documento"
              value={`${profile.documentType?.code ?? 'CC'} ${
                profile.documentNumber
              }`}
            />
            <InfoItem icon={Phone} label="Teléfono" value={profile.phone} />
            <InfoItem
              icon={Mail}
              label="Correo electrónico"
              value={profile.email}
            />
            <InfoItem
              icon={UserRound}
              label="Rol"
              value={profile.roleName || 'Colaborador'}
            />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Tus datos personales son administrados por LUUP. Si necesitas
            corregirlos, comunícate con un administrador.
          </p>
        </section>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {photoPreview && (
        <PhotoPreviewModal
          preview={photoPreview}
          uploading={uploading}
          error={uploadError}
          onConfirm={handleConfirm}
          onCancel={clearPreview}
        />
      )}
    </div>
  );
}
