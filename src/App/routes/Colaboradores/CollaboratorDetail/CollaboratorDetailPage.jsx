import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Briefcase,
  Heart,
  Phone,
  Pill,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCollaboratorDetailService } from '../services/collaboratorServices';

/* ── Helpers ─────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function genderLabel(gender) {
  const map = { male: 'Masculino', female: 'Femenino', other: 'Otro' };
  return map[gender] ?? '—';
}

/* ── Skeleton ────────────────────────────────────────────── */
function Skeleton({ className }) {
  return (
    <div className={`animate-pulse bg-muted rounded-md ${className ?? ''}`} />
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-5 w-40" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-5 w-36" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Campo de detalle ────────────────────────────────────── */
function DetailField({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-foreground font-medium">
        {value ?? '—'}
      </p>
    </div>
  );
}

/* ── Sección ─────────────────────────────────────────────── */
function Section({ icon: Icon, title, children }) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3 pt-4 px-5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-brand" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {children}
      </CardContent>
    </Card>
  );
}

/* ── Página ──────────────────────────────────────────────── */
function CollaboratorDetailPage() {
  const { collaboratorId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [collaborator, setCollaborator] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getCollaboratorDetailService(collaboratorId).then((res) => {
      if (res.status) {
        setCollaborator(res.collaborator);
      } else {
        setError(res.errors ?? 'No se pudo cargar el colaborador.');
      }
      setLoading(false);
    });
  }, [collaboratorId]);

  /* ── Error state ──────────────────────────────────────── */
  if (!loading && error) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              Error al cargar el colaborador
            </p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate('/colaboradores')}
          >
            <ArrowLeft className="w-4 h-4" />
            Ir para atrás
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Encabezado ───────────────────────────────────── */}
        <div className="flex items-start gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => navigate('/colaboradores')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-7 w-52" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground tracking-tight truncate">
                  {collaborator.firstName} {collaborator.lastName}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge
                    variant="outline"
                    className="text-xs font-semibold px-1.5 py-0"
                  >
                    {collaborator.typeDocument?.code ?? '—'} {collaborator.cedula}
                  </Badge>
                  <Badge
                    className={`text-xs border-0 ${
                      collaborator.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {collaborator.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                  {collaborator.roleName && (
                    <Badge className="text-xs border-0 bg-violet-100 text-violet-700">
                      {collaborator.roleName}
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Skeleton completo ────────────────────────────── */}
        {loading && <DetailSkeleton />}

        {/* ── Contenido ────────────────────────────────────── */}
        {!loading && collaborator && (
          <div className="space-y-4">

            {/* Información personal */}
            <Section icon={User} title="Información personal">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                <DetailField label="Teléfono" value={collaborator.phone} />
                <DetailField label="Correo electrónico" value={collaborator.email} />
                <DetailField label="Edad" value={collaborator.age} />
                <DetailField label="Género" value={genderLabel(collaborator.gender)} />
                <DetailField label="Fecha de nacimiento" value={formatDate(collaborator.birthDate)} />
                <DetailField label="Tipo de sangre" value={collaborator.bloodType} />
                <DetailField label="Dirección" value={collaborator.address} />
                <DetailField label="Ocupación actual" value={collaborator.currentOccupation} />
                <DetailField label="Talla de uniforme" value={collaborator.uniformSize} />
                <DetailField label="Fecha de registro" value={formatDate(collaborator.createdAt)} />
              </div>
            </Section>

            {/* Salud */}
            <Section icon={Heart} title="Salud">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                <DetailField
                  label="¿Tiene enfermedades?"
                  value={collaborator.hasDisease === true ? 'Sí' : collaborator.hasDisease === false ? 'No' : '—'}
                />
                {collaborator.hasDisease && (
                  <div className="col-span-2">
                    <DetailField label="Descripción de la enfermedad" value={collaborator.diseaseDescription} />
                  </div>
                )}
                <DetailField
                  label="¿Toma medicamentos?"
                  value={collaborator.takesMedication === true ? 'Sí' : collaborator.takesMedication === false ? 'No' : '—'}
                />
                {collaborator.takesMedication && (
                  <div className="col-span-2">
                    <DetailField label="Medicamentos" value={collaborator.medicationDescription} />
                  </div>
                )}
              </div>
            </Section>

            {/* Contacto de emergencia */}
            <Section icon={Phone} title="Contacto de emergencia">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                <DetailField label="Nombre" value={collaborator.emergencyContactName} />
                <DetailField label="Teléfono" value={collaborator.emergencyContactPhone} />
              </div>
            </Section>

            {/* Información bancaria */}
            <Section icon={Banknote} title="Información bancaria">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                <DetailField label="Banco" value={collaborator.bankName} />
                <DetailField label="Número de cuenta" value={collaborator.accountNumber} />
              </div>
            </Section>

            {/* Experiencia laboral */}
            <Section icon={Briefcase} title="Experiencia laboral">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                <DetailField
                  label="¿Tiene experiencia previa?"
                  value={collaborator.hasExperience === true ? 'Sí' : collaborator.hasExperience === false ? 'No' : '—'}
                />
                {collaborator.hasExperience && (
                  <div className="col-span-2">
                    <DetailField label="Descripción" value={collaborator.experienceDescription} />
                  </div>
                )}
              </div>
            </Section>

            {/* Notas adicionales */}
            {collaborator.additionalNotes && (
              <Section icon={Pill} title="Notas adicionales">
                <p className="text-sm text-foreground leading-relaxed">
                  {collaborator.additionalNotes}
                </p>
              </Section>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

export default CollaboratorDetailPage;
