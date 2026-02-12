/* eslint-disable react/no-array-index-key */
import { CheckCircle, Upload, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const ERRORS_USE_DROP_ZONE = [
  {
    type: 'file-invalid-type',
    message:
      'El tipo de archivo debe ser image/jpeg, .jpeg, .jpg, image/png, .png, application/pdf, .pdf',
  },
  {
    type: 'file-too-large',
    message: 'El archivo no puede ser mayor de 20 megabytes',
  },
  {
    type: 'too-many-files',
    message: 'Se alcanzó el número máximo de archivos permitidos.',
  },
];

/**
 * FileUpload component for uploading files with drag-and-drop support.
 *
 * @param {Object} props - Component props.
 * @param {string} props.label - Label for the file upload input.
 * @param {boolean} [props.required=false] - Whether the upload is required.
 * @param {boolean} [props.disabled=false] - Whether the upload is disabled.
 * @param {function} props.handleUploadChange - Callback when files are uploaded. Receives an array of accepted files.
 * @param {function} props.handleUploadDelete - Callback when a file is deleted. Receives the index of the file to delete.
 * @param {File[]} [props.files=[]] - Array of currently uploaded files.
 * @param {number} [props.maxFiles=1] - Maximum number of files allowed to upload.
 * @param {Object} [props.accept] - Custom accept object for react-dropzone (overrides default image/pdf types).
 * @param {string} [props.acceptText] - Human-readable description of accepted types shown as helper text.
 * @returns {JSX.Element} File upload UI component.
 */
export function FileUpload({
  label,
  required = false,
  disabled = false,
  handleUploadChange,
  handleUploadDelete,
  files = [],
  maxFiles = 1,
  accept,
  acceptText,
}) {
  const reachedLimit = files.length >= maxFiles;
  const isDisabled = disabled || reachedLimit;

  const { getRootProps, getInputProps, fileRejections } = useDropzone({
    disabled: isDisabled,
    multiple: maxFiles > 1, // permitir múltiple sólo si maxFiles > 1
    maxFiles,
    onDrop: (accepted) => {
      if (accepted.length === 0) return;

      // Defensa adicional: no aceptar más si ya se llenó
      if (files.length >= maxFiles) {
        toast.error('Ya alcanzaste el máximo de archivos.');
        return;
      }

      // Si la suma excede (caso multiple), recortar
      let usable = accepted;
      const remainingSlots = maxFiles - files.length;
      if (accepted.length > remainingSlots) {
        usable = accepted.slice(0, remainingSlots);
        toast.message(
          `Sólo se aceptaron ${remainingSlots} archivo(s) para no exceder el máximo (${maxFiles}).`,
        );
      }

      handleUploadChange(usable);
    },
    accept: accept ?? {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 20 * 1024 * 1024, // 20 MB
  });

  useEffect(() => {
    if (fileRejections.length === 0) return;

    const first = fileRejections[0];
    if (!first?.errors?.length) return;

    const errCode = first.errors[0].code;
    const found = ERRORS_USE_DROP_ZONE.find((e) => e.type === errCode);
    if (found) {
      toast.error(found.message);
    } else {
      toast.error('Ha ocurrido un error al cargar el archivo.');
    }
  }, [fileRejections]);

  const helperText = useMemo(() => {
    if (reachedLimit)
      return `Máximo de ${maxFiles} archivo(s) alcanzado. Elimina para reemplazar.`;
    const typeDesc = acceptText ?? 'PDF, JPG, PNG';
    return `${typeDesc} (máx. 20MB)${
      maxFiles > 1 ? ` | Puedes subir hasta ${maxFiles} archivos.` : ''
    }`;
  }, [reachedLimit, maxFiles, acceptText]);

  return (
    <div className="space-y-2">
      <Label className="text-gray-700 font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      <div
        className={[
          'border-2 border-dashed rounded-lg p-4 transition-colors',
          isDisabled
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-70'
            : 'border-gray-200 hover:border-[#3377f5] cursor-pointer',
        ].join(' ')}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-2 text-center select-none">
          <Upload className="w-8 h-8 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">
            {reachedLimit
              ? 'Límite alcanzado'
              : 'Haz clic o arrastra para subir archivo'}
          </p>
          <p className="text-xs text-gray-500">{helperText}</p>
        </div>

        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-green-50 p-2 rounded"
              >
                <span className="text-sm text-green-700 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {file.name}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUploadDelete(index);
                  }}
                  className="cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
