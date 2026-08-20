import path from 'node:path';

/**
 * Cada pacote tem o seu próprio `eslint.config.mjs`, e o ESLint com flat config
 * procura a configuração no diretório de trabalho — não no diretório do arquivo.
 * Por isso os arquivos preparados são agrupados por pacote e o ESLint é
 * executado uma vez em cada um, com o cwd correto.
 */
const PACOTES = ['apps/api', 'apps/web', 'packages/contracts'];

const aspas = (valor) => `"${valor}"`;

function lintPorPacote(arquivos) {
  const raiz = process.cwd();

  return PACOTES.flatMap((pacote) => {
    const doPacote = arquivos.filter((arquivo) =>
      path.relative(raiz, arquivo).startsWith(`${pacote}${path.sep}`),
    );

    if (doPacote.length === 0) return [];

    const relativos = doPacote.map((arquivo) =>
      aspas(path.relative(path.join(raiz, pacote), arquivo)),
    );

    return [`pnpm --dir ${pacote} exec eslint --fix ${relativos.join(' ')}`];
  });
}

export default {
  '*.{ts,tsx}': lintPorPacote,
  '*.{ts,tsx,js,jsx,mjs,json,yml,yaml,css}': 'prettier --write',
};
