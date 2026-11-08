# base64Converter (CLI + GUI)

Aplicação que lê conteúdo Base64 da área de colagem, valida se é PDF e salva em `~/Downloads` com o título do PDF.

## Regras

- Se o PDF tiver título nos metadados, usa esse título como nome do arquivo.
- Se não tiver título, usa o formato: `<ano_mês_dia_hora_minuto>_PDF.pdf`.
- Se o arquivo já existir, adiciona sufixo incremental (`_1`, `_2`, ...).

## Interface gráfica (GUI)

- Botão **Salvar**: valida o Base64 no clipboard e salva o PDF.
- Confirmação visual de sucesso/erro para o usuário.
- Lista de PDFs da pasta `Downloads`.
- Cada item da lista possui botão **Arrastar** (drag & drop para fora da janela) e **Mostrar** (abre no Finder/Explorer).

## Uso

1. Instale dependências:

```bash
npm install
```

2. Copie para a área de colagem um Base64 de PDF (puro ou `data:application/pdf;base64,...`).

3. Execute a GUI:

```bash
npm start
```

4. (Opcional) Execute o modo CLI:

```bash
npm run cli
```
