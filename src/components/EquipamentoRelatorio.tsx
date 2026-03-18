import { forwardRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import spliceLogo from '@/assets/splice-logo.png';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Radio, 
  ArrowUpDown, 
  ArrowLeftRight, 
  Wrench, 
  Settings,
  Calendar,
  Gauge,
  Layers,
  Wifi,
  Zap
} from 'lucide-react';

interface SinalizacaoVertical {
  id: string;
  categoria: string;
  tipo: string;
  subtipo: string;
  instalacao: string;
  lado: string;
  endereco: string;
  data: string | null;
  foto_url: string | null;
  qtd_pontaletes: number | null;
  qtd_postes_colapsiveis: number | null;
  qtd_perfis_metalicos: number | null;
  total_m2: number | null;
  sentido?: { nome: string } | null;
}

interface SinalizacaoHorizontal {
  id: string;
  tipo: string;
  endereco: string;
  lado: string;
  data: string | null;
  foto_url: string | null;
  qtd_laminas: number | null;
  qtd_postes: number | null;
  sentido?: { nome: string } | null;
}

interface InfraestruturaItem {
  id: string;
  tipo: string;
  quantidade: number;
  data: string | null;
  foto_url: string | null;
}

interface OperacionalItem {
  id: string;
  tipo: string;
  quantidade: number;
  data: string | null;
  foto_url: string | null;
  observacao: string | null;
}

interface EquipamentoSentidoRelatorio {
  faixa_numero: number;
  sentido: { nome: string } | null;
}

interface Equipamento {
  id: string;
  numero_serie: string;
  endereco: string;
  municipio: string;
  tipo_equipamento: string | null;
  velocidade: string | null;
  quantidade_faixas: number | null;
  tipo_conexao: string | null;
  tipo_energia: string | null;
  conexao_instalada: boolean | null;
  energia_instalada: boolean | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  contrato?: { id_contrato: string; nome: string };
  sentido?: { nome: string } | null;
}

interface EquipamentoRelatorioProps {
  equipamento: Equipamento;
  sinalizacaoVertical: SinalizacaoVertical[];
  sinalizacaoHorizontal: SinalizacaoHorizontal[];
  infraestrutura: InfraestruturaItem[];
  operacional: OperacionalItem[];
  equipamentoSentidos?: EquipamentoSentidoRelatorio[];
}

const EquipamentoRelatorio = forwardRef<HTMLDivElement, EquipamentoRelatorioProps>(
  ({ equipamento, sinalizacaoVertical, sinalizacaoHorizontal, infraestrutura, operacional, equipamentoSentidos = [] }, ref) => {
    const formatDate = (date: string | null) => {
      if (!date) return '-';
      return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
    };

    const getCategoriaLabel = (categoria: string) => {
      const labels: Record<string, string> = {
        'placas': 'Placas',
        'braco_projetado': 'Braço Projetado',
        'semi_portico': 'Semi Pórtico',
      };
      return labels[categoria] || categoria;
    };

    const getTipoHorizontalLabel = (tipo: string) => {
      return tipo || 'Sem tipo';
    };

    return (
      <div ref={ref} className="bg-white text-gray-900 p-8 max-w-[210mm] mx-auto print:p-6 print:max-w-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-primary pb-6 mb-8">
          <div className="flex items-center gap-4">
            <img src={spliceLogo} alt="Splice Logo" className="h-16 w-auto object-contain" />
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-primary">Relatório de Implantação</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerado em {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Informações do Equipamento */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-gray-800">Dados do Equipamento</h2>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Número de Série</p>
                <p className="text-sm font-semibold">{equipamento.numero_serie}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</p>
                <p className="text-sm font-semibold">{equipamento.tipo_equipamento || '-'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contrato</p>
                <p className="text-sm font-semibold">
                  {equipamento.contrato ? `${equipamento.contrato.id_contrato} - ${equipamento.contrato.nome}` : '-'}
                </p>
              </div>

              <div className="space-y-1 col-span-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Endereço
                </p>
                <p className="text-sm font-semibold">{equipamento.endereco}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Município</p>
                <p className="text-sm font-semibold">{equipamento.municipio}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Gauge className="h-3 w-3" /> Velocidade
                </p>
                <p className="text-sm font-semibold">{equipamento.velocidade ? `${equipamento.velocidade} km/h` : '-'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Layers className="h-3 w-3" /> Faixas
                </p>
                <p className="text-sm font-semibold">{equipamento.quantidade_faixas || '-'}</p>
              </div>

              {equipamentoSentidos.length > 0 && (
                <div className="space-y-1 col-span-2 md:col-span-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sentidos por Faixa</p>
                  <div className="flex flex-wrap gap-2">
                    {equipamentoSentidos.map((es) => (
                      <Badge key={es.faixa_numero} variant="outline" className="text-xs">
                        Faixa {es.faixa_numero}: {es.sentido?.nome || '-'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Wifi className="h-3 w-3" /> Conexão
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{equipamento.tipo_conexao || '-'}</p>
                  {equipamento.conexao_instalada && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Instalado</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Energia
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{equipamento.tipo_energia || '-'}</p>
                  {equipamento.energia_instalada && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Instalado</Badge>
                  )}
                </div>
              </div>

              {equipamento.latitude && equipamento.longitude && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Coordenadas</p>
                  <p className="text-sm font-semibold">{equipamento.latitude}, {equipamento.longitude}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Sinalização Vertical */}
        {sinalizacaoVertical.length > 0 && (
          <section className="mb-8 break-inside-avoid">
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpDown className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">Sinalização Vertical</h2>
              <Badge className="bg-blue-100 text-blue-700">{sinalizacaoVertical.length} item(ns)</Badge>
            </div>
            
            <div className="space-y-4">
              {sinalizacaoVertical.map((item, index) => (
                <div key={item.id} className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-bold text-blue-600 uppercase">Item {index + 1}</span>
                      <h3 className="font-semibold text-gray-800">{getCategoriaLabel(item.categoria)}</h3>
                    </div>
                    {item.data && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.data)}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Tipo</p>
                      <p className="font-medium">{item.tipo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Subtipo</p>
                      <p className="font-medium">{item.subtipo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Instalação</p>
                      <p className="font-medium">{item.instalacao}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Lado</p>
                      <p className="font-medium">{item.lado}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Endereço</p>
                      <p className="font-medium">{item.endereco}</p>
                    </div>
                    {item.sentido && (
                      <div>
                        <p className="text-xs text-gray-500">Sentido</p>
                        <p className="font-medium">{item.sentido.nome}</p>
                      </div>
                    )}
                    {item.total_m2 && (
                      <div>
                        <p className="text-xs text-gray-500">Total m²</p>
                        <p className="font-medium">{item.total_m2} m²</p>
                      </div>
                    )}
                  </div>

                  {/* Quantidades de suporte */}
                  {(item.qtd_pontaletes || item.qtd_postes_colapsiveis || item.qtd_perfis_metalicos) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.qtd_pontaletes && item.qtd_pontaletes > 0 && (
                        <Badge variant="secondary" className="text-xs">Pontaletes: {item.qtd_pontaletes}</Badge>
                      )}
                      {item.qtd_postes_colapsiveis && item.qtd_postes_colapsiveis > 0 && (
                        <Badge variant="secondary" className="text-xs">Postes Colapsíveis: {item.qtd_postes_colapsiveis}</Badge>
                      )}
                      {item.qtd_perfis_metalicos && item.qtd_perfis_metalicos > 0 && (
                        <Badge variant="secondary" className="text-xs">Perfis Metálicos: {item.qtd_perfis_metalicos}</Badge>
                      )}
                    </div>
                  )}

                  {item.foto_url && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">Foto</p>
                      <img 
                        src={item.foto_url} 
                        alt={`Sinalização ${index + 1}`} 
                        className="w-48 h-36 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sinalização Horizontal */}
        {sinalizacaoHorizontal.length > 0 && (
          <section className="mb-8 break-inside-avoid">
            <div className="flex items-center gap-2 mb-4">
              <ArrowLeftRight className="h-5 w-5 text-amber-600" />
              <h2 className="text-xl font-bold text-gray-800">Sinalização Horizontal</h2>
              <Badge className="bg-amber-100 text-amber-700">{sinalizacaoHorizontal.length} item(ns)</Badge>
            </div>
            
            <div className="space-y-4">
              {sinalizacaoHorizontal.map((item, index) => (
                <div key={item.id} className="bg-amber-50/50 rounded-lg p-4 border border-amber-100">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-bold text-amber-600 uppercase">Item {index + 1}</span>
                      <h3 className="font-semibold text-gray-800">{getTipoHorizontalLabel(item.tipo)}</h3>
                    </div>
                    {item.data && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.data)}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Endereço</p>
                      <p className="font-medium">{item.endereco}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Lado</p>
                      <p className="font-medium">{item.lado}</p>
                    </div>
                    {item.sentido && (
                      <div>
                        <p className="text-xs text-gray-500">Sentido</p>
                        <p className="font-medium">{item.sentido.nome}</p>
                      </div>
                    )}
                    {item.qtd_laminas && item.qtd_laminas > 0 && (
                      <div>
                        <p className="text-xs text-gray-500">Lâminas</p>
                        <p className="font-medium">{item.qtd_laminas}</p>
                      </div>
                    )}
                    {item.qtd_postes && item.qtd_postes > 0 && (
                      <div>
                        <p className="text-xs text-gray-500">Postes</p>
                        <p className="font-medium">{item.qtd_postes}</p>
                      </div>
                    )}
                  </div>

                  {item.foto_url && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">Foto</p>
                      <img 
                        src={item.foto_url} 
                        alt={`Sinalização Horizontal ${index + 1}`} 
                        className="w-48 h-36 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Infraestrutura */}
        {infraestrutura.length > 0 && (
          <section className="mb-8 break-inside-avoid">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold text-gray-800">Infraestrutura</h2>
              <Badge className="bg-green-100 text-green-700">{infraestrutura.length} item(ns)</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {infraestrutura.map((item, index) => (
                <div key={item.id} className="bg-green-50/50 rounded-lg p-4 border border-green-100">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-bold text-green-600 uppercase">Item {index + 1}</span>
                      <h3 className="font-semibold text-gray-800 capitalize">{item.tipo}</h3>
                    </div>
                    {item.data && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.data)}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm mb-3">
                    <p className="text-xs text-gray-500">Quantidade</p>
                    <p className="font-medium text-lg">{item.quantidade}</p>
                  </div>

                  {item.foto_url && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">Foto</p>
                      <img 
                        src={item.foto_url} 
                        alt={`Infraestrutura ${index + 1}`} 
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Operacional */}
        {operacional.length > 0 && (
          <section className="mb-8 break-inside-avoid">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-800">Operacional</h2>
              <Badge className="bg-purple-100 text-purple-700">{operacional.length} item(ns)</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {operacional.map((item, index) => (
                <div key={item.id} className="bg-purple-50/50 rounded-lg p-4 border border-purple-100">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-bold text-purple-600 uppercase">Item {index + 1}</span>
                      <h3 className="font-semibold text-gray-800 capitalize">{item.tipo}</h3>
                    </div>
                    {item.data && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.data)}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm mb-3">
                    <p className="text-xs text-gray-500">Quantidade</p>
                    <p className="font-medium text-lg">{item.quantidade}</p>
                  </div>

                  {item.observacao && (
                    <div className="text-sm mb-3">
                      <p className="text-xs text-gray-500">Observação</p>
                      <p className="font-medium text-gray-700">{item.observacao}</p>
                    </div>
                  )}

                  {item.foto_url && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">Foto</p>
                      <img 
                        src={item.foto_url} 
                        alt={`Operacional ${index + 1}`} 
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-4 mt-8 text-center text-xs text-gray-500 print:fixed print:bottom-0 print:left-0 print:right-0 print:bg-white">
          <p>Sistema de Implantação de Radares - Splice Engenharia</p>
          <p>Documento gerado automaticamente em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </footer>
      </div>
    );
  }
);

EquipamentoRelatorio.displayName = 'EquipamentoRelatorio';

export default EquipamentoRelatorio;
