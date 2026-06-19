# Atalhos de Teclado — Editor de Mapas Mentais (Acropolis Scholar)

> **Ctrl** no Windows/Linux → **⌘ Cmd** no macOS

---

## Núcleo de Edição

| Atalho                 | Ação                                                    |
| ---------------------- | ------------------------------------------------------- |
| `Enter`                | Cria tópico irmão abaixo do selecionado                 |
| `Shift+Enter`          | Cria tópico irmão acima do selecionado                  |
| `Tab`                  | Cria subtópico (filho) do selecionado e entra em edição |
| `Shift+Tab`            | Promove tópico (move para o nível do pai)               |
| `Ctrl+Enter`           | Cria tópico pai acima _(em breve)_                      |
| `F2`                   | Inicia edição do label do tópico selecionado            |
| `Delete` / `Backspace` | Remove tópico selecionado e todos os descendentes       |
| `Escape`               | Sai do modo edição ou limpa a seleção                   |

---

## Histórico

| Atalho                    | Ação                     |
| ------------------------- | ------------------------ |
| `Ctrl+Z`                  | Desfazer (até 50 passos) |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Refazer                  |

---

## Área de Transferência

| Atalho   | Ação                                          |
| -------- | --------------------------------------------- |
| `Ctrl+C` | Copia sub-árvore do tópico selecionado        |
| `Ctrl+X` | Recorta sub-árvore do tópico selecionado      |
| `Ctrl+V` | Cola sub-árvore copiada com offset de posição |

---

## Expansão e Colapso

| Atalho | Ação                                 |
| ------ | ------------------------------------ |
| `+`    | Expande ramo do tópico selecionado   |
| `-`    | Colapsa ramo do tópico selecionado   |
| `*`    | Expande todos os ramos               |
| `/`    | Colapsa todos os ramos (exceto raiz) |

---

## Movimentação entre Irmãos

| Atalho  | Ação                                |
| ------- | ----------------------------------- |
| `Alt+↑` | Move tópico para cima entre irmãos  |
| `Alt+↓` | Move tópico para baixo entre irmãos |

---

## Seleção

| Atalho         | Ação                                    |
| -------------- | --------------------------------------- |
| `Ctrl+A`       | Seleciona todos os tópicos              |
| `Ctrl+Shift+A` | Seleciona tópicos irmãos do selecionado |

---

## Visualização e Zoom

| Atalho      | Ação                              |
| ----------- | --------------------------------- |
| `Ctrl+0`    | Reset zoom (100%)                 |
| `Ctrl++`    | Zoom in (+15%)                    |
| `Ctrl+-`    | Zoom out (-15%)                   |
| `Ctrl+Home` | Centraliza a vista no tópico raiz |

---

## Arquivo

| Atalho   | Ação                                                  |
| -------- | ----------------------------------------------------- |
| `Ctrl+S` | Salva o mapa (Supabase ou localStorage como fallback) |

---

## UI

| Atalho         | Ação                                    |
| -------------- | --------------------------------------- |
| `Ctrl+Shift+L` | Abre/fecha o painel de ajuda de atalhos |

---

## Interação com Mouse

| Gesto                           | Ação                   |
| ------------------------------- | ---------------------- |
| Clique duplo no nó              | Editar label           |
| Arrastar nó                     | Reposicionar           |
| Arrastar canvas (fundo)         | Pan                    |
| Scroll do mouse                 | Zoom in/out            |
| Clique no `+` do nó selecionado | Adiciona filho         |
| Clique no `×` do nó selecionado | Remove nó              |
| Clique no `•` abaixo do nó      | Expandir/colapsar ramo |
