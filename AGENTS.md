# Rota RN — guia para agentes de código

App didático de **rastreamento de rotas** (trilha/corrida) em React Native + Expo, usado como
material de apoio da disciplina de **Aplicativos Móveis (ETEC)**. Cobre a ementa: leiautes e
componentes básicos, listas e imagens, navegação, mapas, câmera/galeria, contatos,
acelerômetro, bússola, geolocalização, serviços em segundo plano, notificações e SQLite.

## Comandos

```bash
npm run start        # dev server
npm run android      # abre no Android
npm run typecheck    # tsc --noEmit
npm run lint         # expo lint (ESLint 9 + eslint-config-expo)
npm run doctor       # expo-doctor (21 checks)

npx expo install <pkg>    # SEMPRE para instalar — resolve a versão do SDK
npx expo install --check  # confirma que o lockfile bate com o SDK
```

**Gate obrigatório antes de dizer que terminou:**

```bash
npm run lint && npm run typecheck && npm run doctor
```

Bundle de fumaça (sem emulador, pega erro de import):

```bash
npx expo export --platform android --output-dir .smoke && rm -r .smoke
```

## Armadilha do ambiente

O caminho deste projeto **contém espaço** (`.../2. Code/...`) e o CLI do Expo embaralha
argumentos de subcomando nesse caso. Consequência prática:

- `npx expo uninstall <pkg>` falha com `Invalid project root: ...\uninstall`.
  Use `npm uninstall <pkg>` e depois rode `npx expo install --check` para confirmar a versão.
- Prefira sempre `workdir`/diretório de trabalho ao combinar `cd` com caminhos com espaço.

## Arquitetura

| Caminho | Conteúdo |
| --- | --- |
| `app/` | **Rotas do Expo Router.** Cada arquivo é uma tela; `_layout.tsx` define navegadores. |
| `src/components/` | Componentes de apresentação (`Screen`, `Button`, `Card`, `Stat`, `EmptyState`…). |
| `src/hooks/` | Hooks que integram módulos nativos (`usePedometer`, `useCompass`, `useShake`, `useLocationPermissions`). |
| `src/services/` | Efeitos colaterais: `locationTask`, `notifications`, `contacts`, `media`. |
| `src/db/` | `schema.ts` (DDL + migrações), `index.ts` (singleton), um arquivo por repositório. |
| `src/theme/` | Tokens de cor/espaçamento/tipografia + helpers. |
| `src/utils/` | `geo.ts`, `format.ts` — funções puras e testáveis. |

Regras de navegação:

- Rotas ficam em **`app/`** (raiz), **não** em `src/app/`.
- `useFocusEffect` (não `useEffect`) para carregar dados de tela, para recarregar ao voltar.
- `app/_layout.tsx` faz o boot do SQLite antes de renderizar as abas.

## Banco de dados

`getDatabase()` em `src/db/index.ts` é um **singleton** com `Promise` memoizado. Todo o
acesso passa pelos repositórios; telas nunca escrevem SQL.

- `PRAGMA journal_mode = WAL` e `PRAGMA foreign_keys = ON` são obrigatórios.
- Migrações versionadas por `PRAGMA user_version`, aplicadas em ordem; **nunca** edite uma
  migração já lançada — acrescente a próxima e incremente o array.
- `resetDatabase()` (usado em Ajustes) apaga linhas e reseta `sqlite_sequence`; use só em dev.

## SDK 57 mudou muita coisa — não confie na memória

A maior parte das informações antigas sobre Expo está **errada** neste projeto. Antes de
escrever código que toca uma API do Expo:

1. Leia a versão `expo` em `package.json`.
2. Consulte `https://docs.expo.dev/versions/v57.0.0/`.
3. Para duvidas fora da versioning, use `https://docs.expo.dev/llms.txt`.

Migrações já aplicadas neste repositório (todas verificadas contra os docs do v57):

| Módulo | API antiga (NÃO usar) | API do SDK 57 |
| --- | --- | --- |
| `expo-contacts` | `Contacts.getContactsAsync` | `Contact.getAllDetailsAsync`, `ContactField`, `ContactsSortOrder`. Legado só em `expo-contacts/legacy`. |
| `expo-sensors` | `Accelerometer/Gyroscope.watch*(...)` | `addListener(...)` + `setUpdateInterval`. `Pedometer.watchStepCount` continua válido. |
| `expo-file-system` | `FileSystem.writeAsStringAsync` | `File`/`Directory`/`Paths`. Legado em `expo-file-system/legacy`. |
| `expo-image-picker` | `mediaTypes: ImagePicker.MediaTypeOptions.Images` | `mediaTypes: ['images']`. |
| `expo-notifications` | `shouldShowAlert` | `shouldShowBanner` + `shouldShowList`. |
| `expo-location` | `setHeadingUpdateInterval`, `magneticHeading` | Removidos. Use `watchHeadingAsync` e o campo `magHeading`. |
| `expo-background-fetch` | pacote em desuso | `expo-background-task` + `expo-task-manager`. |
| `app.json` | `newArchEnabled`, `splash` | Removidos do schema. Splash virou config do plugin `expo-splash-screen`. |

## Escolhas deliberadas

Não "conserte" estas coisas sem antes ler o comentário no código:

- **Sem alvo web.** `react-native-maps` e `expo-sqlite` web não suportam este projeto; o
  script `web` e o bloco `web` do `app.json` foram removidos de propósito.
- **`react-native-maps`, não `expo-maps`.** `expo-maps` está em alpha, exige dev build e
  chave de API — inviável para uma aula. O `react-native-maps` roda direto no Expo Go.
- **Rastreio em background desligado** (`USE_BACKGROUND_TASK = false` em `app/(tabs)/rastrear.tsx`)
  porque `expo-background-task` não roda no Expo Go. Para ligar: dev build
  (`npx expo run:android`) e, antes disso, resolver o treino ativo do banco dentro da task —
  hoje o estado ativo vive na memória do módulo e se perde quando o JS é recriado.
- **Câmera via `expo-image-picker`** (`launchCameraAsync`), por isso `expo-camera` não é
  dependência. Bússola via `expo-location` (`watchHeadingAsync`), não `expo-sensors`.
- **`expo-notifications` não pode ser importado estaticamente.** Desde o SDK 53 o Expo Go
  removeu esse módulo no Android e a importação **lança** — o que derrubava o `default
  export` de `ajustes.tsx` e `rastrear.tsx` e matava o app na tela de erro vermelha.
  Por isso `src/services/notifications.ts` usa `require` dentro de `try/catch` e degrada
  para "indisponível". **Não volte a usar `import * as Notifications from
  'expo-notifications'`**; isso quebra o app no Expo Go. Notificação local só funciona
  em development build (Android).
- **`create`/`write`/`copy`/`delete` do `expo-file-system` são assíncronos e precisam de
  `await`.** Sem isso o arquivo ainda não existe quando o `Sharing.shareAsync` roda
  (`FileNotFoundException`) e o `copy` falha porque o diretório destino não foi criado.
  Afeta `app/treino/[id].tsx` e `src/services/media.ts`.

## Regras

- O projeto é **Android-only** (material didático). Não reintroduza referências a iOS: o alvo
  web já foi removido de propósito e o script `ios` foi apagado do `package.json`.
- `ios/` e `android/` não existem e não devem ser criados à mão (Continuous Native
  Generation). Comportamento nativo se configura em `app.json` e config plugins.
- Expo Go traz só os módulos nativos que já embute. Depois de adicionar biblioteca com
  código nativo, é preciso dev build: `npx expo run:android` ou `eas build -p development`.
- Prefira módulos recomendados do Expo a bibliotecas de terceiros.
- Detalhe de build/sign/envio: `https://docs.expo.dev/eas/introduction/`.
- Não adicione `comments` explicativos em código novo a menos que sejam pedidos; o código
  deve se explicar pelos nomes.
- Não rode `npm audit fix --force` (o lockfile tem avisos moderados e o force traz
  breaking changes) e nunca use `rm -rf node_modules` como atalho para resolver problema de
  versão — use `npx expo install --fix`.
