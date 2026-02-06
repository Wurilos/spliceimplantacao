
# Filtrar Itens de Suporte na Categoria de Sinalização Vertical

## Objetivo
Remover os itens "Pontaletes", "Perfil Metálico" e "Postes Colapsíveis" do dropdown de categorias no formulário de Sinalização Vertical, pois esses itens são capturados como campos de quantidade ao cadastrar uma Placa.

## Justificativa
Esses três itens representam materiais de suporte que acompanham as placas durante a implantação. O formulário atual já possui campos específicos para registrar a quantidade desses materiais (Qtd. Pontaletes, Qtd. Perfis Metálicos, Qtd. Postes Colapsíveis), tornando redundante sua exibição como opções de categoria principal.

## Solução Proposta
Modificar o hook `useSinalizacaoVerticalCategoria.ts` para filtrar automaticamente esses itens da lista retornada.

### Implementacao

**Arquivo:** `src/hooks/useSinalizacaoVerticalCategoria.ts`

Adicionar um filtro após buscar os itens do banco de dados:

```typescript
// Itens que sao campos de quantidade nas placas - nao devem aparecer como categorias
const ITENS_SUPORTE_PLACA = [
  'pontalete',
  'perfil metálico', 
  'perfil metalico',
  'postes colapsíveis',
  'postes colapsiveis',
  'poste colapsível',
  'poste colapsivel'
];

// Filtrar itens de suporte
const itensFiltrados = itens.filter(item => {
  const nomeNormalizado = item.nome.toLowerCase();
  return !ITENS_SUPORTE_PLACA.some(termo => nomeNormalizado.includes(termo));
});
```

### Resultado Esperado
O dropdown de categorias exibirá apenas:
- Placas
- Braço Projetado
- Semi Pórtico

Os itens filtrados continuarão disponíveis como campos de quantidade no formulário de placas.

---

## Detalhes Tecnicos

### Alteracoes de Codigo
| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `src/hooks/useSinalizacaoVerticalCategoria.ts` | Modificacao | Adicionar filtro para excluir itens de suporte |

### Logica de Filtragem
A filtragem será feita por nome normalizado (lowercase) para garantir correspondência mesmo com variações de acentuação ou capitalização.
