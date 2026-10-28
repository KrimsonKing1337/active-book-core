import { fileURLToPath } from 'node:url';

/*
На данный момент этот конфиг выполняет только одну функцию - подсветка путей
в scss в IDE. Тильда заменяет /src/. Это нужно, чтобы не пришлось писать ../../.
А резолв путей при сборке делает scripts/scssAlias.js.
Так что это два независимых механизма.
В будущем планируется полный переход на Vite для сборки,
и это, в том числе, будет использоваться
*/

export default {
  resolve: {
    alias: {
      '~assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '~styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
    },
  },
};
