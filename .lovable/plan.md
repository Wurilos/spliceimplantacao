
# Plano de Implementação: Sistema de Implantação de Radares

## Visão Geral
Sistema completo para gerenciar implantação de radares com controle de equipamentos, sinalização vertical e horizontal, autenticação por perfis e dashboard analítico.

---

## 1. Estrutura do Banco de Dados (Supabase)

### Tabelas principais:
- **contratos** - Cadastro de contratos (id_contrato, nome)
- **sentidos** - Direções/sentidos (Norte, Sul, etc.)
- **equipamentos** - Radares com localização, contrato e flags de sinalização
- **equipamento_sentidos** - Múltiplos sentidos por equipamento (tabela de junção)
- **sinalizacao_vertical_blocos** - Blocos de sinalização vertical (pontaletes, perfis metálicos, postes colapsíveis)
- **sinalizacao_horizontal_itens** - Itens horizontais (Defensa Metálica, TAE 80/100 km/h)
- **user_roles** - Controle de permissões (admin, operador, consulta)

### Storage:
- Bucket **fotos** para imagens de placas e defensas

---

## 2. Autenticação e Controle de Acesso

### Tela de Login
- Login com email/senha via Supabase Auth
- Visual limpo e profissional

### Perfis de Acesso (RBAC)
| Perfil | Permissões |
|--------|-----------|
| **Admin** | Acesso total (criar, editar, excluir, consultar) |
| **Operador** | Criar, editar e consultar (sem excluir) |
| **Consulta** | Apenas visualização |

---

## 3. Layout e Navegação

### Sidebar com menu:
- 📊 Dashboard
- 📄 Contratos
- 🧭 Sentidos
- 📡 Equipamentos
- 🔍 Consultas

---

## 4. Telas CRUD

### Contratos
- Lista com busca por ID e nome do contrato
- Criar, editar e excluir contratos

### Sentidos
- Lista com busca
- Criar, editar e excluir sentidos
- Alimenta os selects de sentido em todo o sistema

### Equipamentos (Lista)
- Lista com busca (número de série, município, endereço)
- Filtros por contrato e sentido
- Ícones indicando sinalização vertical/horizontal ativa
- Botão para abrir detalhes

---

## 5. Cadastro de Equipamento (Detalhe com Abas)

### Aba 1: Dados do Equipamento
- Campos: Contrato (select), Nº série, Município, Endereço, Sentido principal (select com **+** para adicionar novo), Latitude/Longitude
- Checkboxes: Sinalização Vertical / Sinalização Horizontal
- **Subseção**: Lista de múltiplos sentidos do equipamento (adicionar/remover)

### Aba 2: Sinalização Vertical *(visível apenas se checkbox marcado)*
- **Blocos repetíveis** (botão "+ Adicionar bloco")
- Cada bloco contém:
  - Endereço, Sentido (filtrado pelos sentidos cadastrados no equipamento)
  - Tipo, Subtipo (Equipamento/Aproximação), Instalação (solo/aérea), Lado (D/E)
  - Latitude/Longitude
  - Upload de foto da placa
  - Quantidades: Pontaletes, Perfis metálicos, Postes colapsíveis

### Aba 3: Sinalização Horizontal *(visível apenas se checkbox marcado)*
- **Selector de tipo**: Defensa Metálica, TAE 80 km/h, TAE 100 km/h
- Campos comuns: Endereço, Lado, Latitude/Longitude, Foto, Qtd Lâminas/Postes
- Campo **Sentido** obrigatório apenas para TAE 80/100 km/h
- Botão "+ Adicionar item"

---

## 6. Dashboard

### Cards de métricas:
- **Materiais Verticais**: Total Pontaletes, Perfis metálicos, Postes colapsíveis
- **Materiais Horizontais**: Total Lâminas, Postes
- **Equipamentos**: Total cadastrados, Com vertical, Com horizontal

### Gráfico:
- Gráfico de barras: Materiais por Contrato

---

## 7. Tela de Consultas

### Seções de pesquisa:
1. **Pesquisa de Equipamentos** - Filtros: Contrato, Município, Sentido, Nº série
2. **Consulta Sinalização Vertical** - Filtros: Contrato, Sentido → Lista com tipos e quantidades
3. **Consulta Sinalização Horizontal** - Filtros: Contrato, Tipo → Lista com quantidades

---

## 8. Design Visual (Clean/Profissional)
- Cores neutras (cinza, branco, azul corporativo)
- Tipografia clara e legível
- Cards com sombras sutis
- Tabelas zebradas para facilitar leitura
- Responsivo para uso em desktop e tablet

---

## Próximos Passos após Implementação
1. Testar fluxo completo de autenticação
2. Validar CRUD de todas as entidades
3. Verificar exibição condicional das abas
4. Testar upload de fotos
5. Validar métricas do dashboard
