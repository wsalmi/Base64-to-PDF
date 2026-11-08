#!/usr/bin/env node

const { savePdfFromClipboard } = require('./lib/pdf-service');

async function main() {
  const result = await savePdfFromClipboard();

  console.log(`PDF salvo com sucesso em: ${result.destination}`);
}

main().catch((error) => {
  console.error(`Erro: ${error.message}`);
  process.exit(1);
});
