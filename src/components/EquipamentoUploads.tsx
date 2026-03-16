import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, X, Loader2 } from 'lucide-react';

interface EquipamentoUploadsProps {
  equipamentoId: string;
  canEdit: boolean;
  projetoCroquiUrl: string | null;
  croquiCaracterizacaoUrl: string | null;
  estudoViabilidadeUrl: string | null;
  relatorioVdmUrl: string | null;
  declaracaoConformidadeUrl: string | null;
  onUpdate: (field: string, url: string | null) => void;
}

interface UploadFieldProps {
  label: string;
  value: string | null;
  fieldKey: string;
  canEdit: boolean;
  onUpload: (file: File, fieldKey: string) => Promise<void>;
  onRemove: (fieldKey: string) => void;
  uploading: string | null;
}

function UploadField({ label, value, fieldKey, canEdit, onUpload, onRemove, uploading }: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isUploading = uploading === fieldKey;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file, fieldKey);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const getFileName = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="flex items-center gap-2 flex-1 p-3 bg-muted/50 rounded-lg border">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline truncate flex-1"
            >
              {getFileName(value)}
            </a>
            {canEdit && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onRemove(fieldKey)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex-1 p-3 bg-muted/30 rounded-lg border border-dashed text-sm text-muted-foreground">
            Nenhum arquivo enviado
          </div>
        )}
        {canEdit && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id={`upload-${fieldKey}`}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              className="shrink-0"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function EquipamentoUploads({
  equipamentoId,
  canEdit,
  projetoCroquiUrl,
  croquiCaracterizacaoUrl,
  estudoViabilidadeUrl,
  relatorioVdmUrl,
  onUpdate,
}: EquipamentoUploadsProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<string | null>(null);

  const handleUpload = async (file: File, fieldKey: string) => {
    if (!file.type.includes('pdf')) {
      toast({ title: 'Apenas arquivos PDF são aceitos', variant: 'destructive' });
      return;
    }

    setUploading(fieldKey);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${fieldKey}_${Date.now()}.${fileExt}`;
      const filePath = `${equipamentoId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('documentos')
        .getPublicUrl(filePath);

      // Update in database
      const dbField = fieldKey.replace(/([A-Z])/g, '_$1').toLowerCase() + '_url';
      const { error: updateError } = await supabase
        .from('equipamentos')
        .update({ [dbField]: urlData.publicUrl })
        .eq('id', equipamentoId);

      if (updateError) throw updateError;

      onUpdate(fieldKey, urlData.publicUrl);
      toast({ title: 'Upload realizado com sucesso!' });
    } catch (error: any) {
      toast({ title: 'Erro ao fazer upload', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  const handleRemove = async (fieldKey: string) => {
    try {
      const dbField = fieldKey.replace(/([A-Z])/g, '_$1').toLowerCase() + '_url';
      const { error } = await supabase
        .from('equipamentos')
        .update({ [dbField]: null })
        .eq('id', equipamentoId);

      if (error) throw error;

      onUpdate(fieldKey, null);
      toast({ title: 'Arquivo removido com sucesso!' });
    } catch (error: any) {
      toast({ title: 'Erro ao remover arquivo', description: error.message, variant: 'destructive' });
    }
  };

  const uploadFields = [
    { key: 'projetoCroqui', label: 'Projeto (Croqui)', value: projetoCroquiUrl },
    { key: 'croquiCaracterizacao', label: 'Croqui de Caracterização', value: croquiCaracterizacaoUrl },
    { key: 'estudoViabilidade', label: 'Estudo de Viabilidade', value: estudoViabilidadeUrl },
    { key: 'relatorioVdm', label: 'Relatório de VDM', value: relatorioVdmUrl },
  ];

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Upload de Arquivos</CardTitle>
            <CardDescription>Documentos técnicos do equipamento (PDF)</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {uploadFields.map((field) => (
          <UploadField
            key={field.key}
            label={field.label}
            value={field.value}
            fieldKey={field.key}
            canEdit={canEdit}
            onUpload={handleUpload}
            onRemove={handleRemove}
            uploading={uploading}
          />
        ))}
      </CardContent>
    </Card>
  );
}
