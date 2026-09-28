# Rota RN

App didático de **rastreamento de rotas** (trilha e corrida) feito em **React Native + Expo**,
usado como material de apoio da disciplina de **Aplicativos Móveis**.

O app resolve um problema concreto — registrar um percurso com o celular, ver o traçado no
mapa, contar passos, marcar pontos de interesse, fotografar o caminho e compartilhar o
resultado — e cada parte desse problema puxa uma tecnologia diferente da ementa. Não é um
projeto de demonstração com telas soltas: os dados são reais, persistem em SQLite e as telas
conversam entre si.

---

## Sumário

1. [O que você vai aprender aqui](#1-o-que-você-vai-aprender-aqui)
2. [Tecnologias e versões](#2-tecnologias-e-versões)
3. [O que você precisa instalar antes](#3-o-que-você-precisa-instalar-antes)
4. [Instalação do projeto](#4-instalação-do-projeto)
5. [Como executar o app](#5-como-executar-o-app)
   - [5.1 Opção A — Celular físico com Expo Go](#51-opção-a--celular-físico-com-expo-go)
   - [5.2 Opção B — Emulador Android pelo terminal (VS Code)](#52-opção-b--emulador-android-pelo-terminal-vs-code)
   - [5.3 Opção C — Emulador pelo Android Studio](#53-opção-c--emulador-pelo-android-studio)
   - [5.4 Opção D — Development build (necessário para background)](#54-opção-d--development-build-necess%C3%A1rio-para-background)
6. [Configurando o emulador Android](#6-configurando-o-emulador-android)
7. [Permissões do app](#7-permissões-do-app)
8. [Tour pelo app, tela por tela](#8-tour-pelo-app-tela-por-tela)
9. [Matriz ementa → tecnologia](#9-matriz-ementa--tecnologia)
10. [Estrutura do projeto](#10-estrutura-do-projeto)
11. [Banco de dados](#11-banco-de-dados)
12. [Scripts disponíveis](#12-scripts-disponíveis)
13. [Solução de problemas](#13-solução-de-problemas)
14. [Perguntas frequentes](#14-perguntas-frequentes)

---

## 1. O que você vai aprender aqui

| Recurso do app | Tecnologia / assunto |
| --- | --- |
| Quatro abas, cabeçalhos, navegação entre telas | **Expo Router** (rotas baseadas em arquivo), Stack e Tabs |
| Telas de formulário com validação | Componentes controlados, `TextInput`, estado com hooks |
| Lista de rotas com "puxar para atualizar" | **`FlatList`** + `RefreshControl` |
| Lista de contatos com busca | `FlatList` + `useEffect` com *debounce* |
| Traçado do percurso no mapa | **`react-native-maps`**, `MapView`, `Polyline`, `Marker` |
| Registrar posição durante o percurso | **`expo-location`**, `watchPositionAsync` |
| Distância, desnível e velocidade | Fórmula de Haversine, matemática pura e testável |
| Contador de passos | **`expo-sensors`** (`Pedometer`) |
| Bússola na tela inicial | **`expo-location`** (`watchHeadingAsync`, magnetômetro) |
| Bater o celular para marcar um marco | **`expo-sensors`** (`Accelerometer`) + **hápico** |
| Foto da capa da rota e do percurso | **`expo-image-picker`** (câmera e galeria) + **`expo-file-system`** |
| Escolher e enviar para um contato | **`expo-contacts`** + **`expo-linking`** (`sms:` / `mailto:`) |
| Compartilhar o resumo do treino | **`expo-sharing`** |
| Lembrete diário e aviso de treino concluído | **`expo-notifications`** — **exige development build**, ver o aviso em [7](#7-permissões-do-app) |
| Gravar e ler rotas, percursos e fotos | **`expo-sqlite`** (SQLite nativo) |
| Preferências e unidades (km/mi) | Persistência em tabela + plug de cor e espaçamento |
| Rastreio com a tela bloqueada | **`expo-background-task`** + **`expo-task-manager`** (ver [5.4](#54-opção-d--development-build-necess%C3%A1rio-para-background)) |

---

## 2. Tecnologias e versões

O projeto está **fixado** nestas versões. Não atualize por conta própria — o SDK do Expo
mantém compatibilidade entre módulos e trocar uma versão isolada quebra o projeto.

| Item | Versão |
| --- | --- |
| Expo SDK | `57.0.25` |
| React Native | `0.86.3` |
| React | `19.2.3` |
| TypeScript | `6.0.3` |
| Expo Router | `57.0.23` |
| expo-sqlite | `57.0.3` |
| react-native-maps | `1.27.2` |
| Node.js | 20 ou superior (testado em `24.15.0`) |
| Gerenciador | npm |

> **Por que `react-native-maps` e não `expo-maps`?**
> O `expo-maps` está em alpha, exige um development build e uma chave de API do Google Maps.
> O `react-native-maps` já vem embutido no **Expo Go**, então dá para escrever e testar a
> matéria na aula sem configuração nenhuma. Foi uma decisão pensando em uso didático.

> **O SDK 57 mudou muita coisa.** APIs antigas como
> `Contacts.getContactsAsync`, `Accelerometer.watchAcceleration`,
> `FileSystem.writeAsStringAsync`, `ImagePicker.MediaTypeOptions` e
> `setHeadingUpdateInterval` **não existem mais**. O arquivo [`AGENTS.md`](./AGENTS.md)
> tem a tabela completa de substituições. Se você seguir um tutorial antigo da internet,
> ele vai te levar ao caminho errado.

---

## 3. O que você precisa instalar antes

### 3.1 Obrigatório: Node.js e VS Code

1. Baixe o Node.js LTS em <https://nodejs.org> (versão 20 ou superior).
2. Verifique no terminal:

   ```bash
   node -v    # deve mostrar v20.x ou maior
   npm -v
   ```

3. Instale o [VS Code](https://code.visualstudio.com).
4. Abra a pasta do projeto no VS Code (`File > Open Folder`). **Abra a pasta do projeto**,
   não o arquivo solto — o projeto precisa do `package.json` na raiz.

### 3.2 Para rodar no celular: Expo Go

Este material é **focado em Android**. Instale o **Expo Go** na Play Store. É o app que executa
o código JavaScript do projeto; você não compila nada.

> O Expo Go só roda a versão mais recente do SDK. Se o app abrir e mostrar erro de
> incompatibilidade, atualize o Expo Go na loja.

### 3.3 Para rodar no emulador: Android Studio

Só é necessário se você for usar o emulador em vez do celular físico.

1. Instale o [Android Studio](https://developer.android.com/studio).
2. Na primeira abertura, aceite instalar o Android SDK.
3. Vá em `More Actions > SDK Manager` e confirme que estes itens estão marcados:
   - **Android SDK Platform 36** (ou 34)
   - **Android SDK Build-Tools**
   - **Android SDK Platform-Tools** ← traz o `adb`
   - **Android Emulator**
   - **Google APIs Intel x86_64 System Image** ou **Google Play Intel x86_64 System Image**
     ← **obrigatório**, senão o mapa aparece em branco
4. Em `Tools > Device Manager`, crie um dispositivo virtual (veja a
   [seção 6](#6-configurando-o-emulador-android)).

### 3.4 Extensões recomendadas do VS Code

| Extensão | Para quê |
| --- | --- |
| **ES7+ React/Redux/React-Native snippets** | Atalhos de `useState`, `useEffect` etc. |
| **Prettier** | Formatação automática do código |
| **ESLint** | Sublinha erros no editor (o projeto já traz a configuração) |
| **Error Lens** | Mostra o erro do TypeScript na própria linha do código |

---

## 4. Instalação do projeto

Com o VS Code aberto na pasta do projeto, abra o terminal com **Ctrl + `** (crase) e rode:

```bash
npm install
```

Esse comando baixa tudo que está listado no `package-lock.json`. Ao terminar, você deve ter
uma pasta `node_modules` na raiz.

Verifique se ficou tudo coerente com o SDK:

```bash
npx expo install --check
```

Resposta esperada: `Dependencies are up to date`.

> **Atenção — o caminho desta pasta contém espaço** (`...\2. Code\...`). O CLI do Expo
> embaralha os argumentos de subcomando nesse caso. Se `npx expo uninstall` falhar com
> `Invalid project root`, use `npm uninstall <pacote>` e depois rode
> `npx expo install --check` para conferir a versão. É um problema conhecido do caminho,
> não do seu projeto.

---

## 5. Como executar o app

Escolha **uma** das quatro opções. As três primeiras rodam no **Expo Go** e não precisam de
compilação nenhuma. A quarta é a única que libera recursos que o Expo Go não tem.

### 5.1 Opção A — Celular físico com Expo Go

É a opção mais simples e a melhor para testar sensores de verdade (passos, bússola,
acelerômetro).

**Passo 1.** Conecte o celular e o computador **no mesmo Wi-Fi**.

**Passo 2.** Rode o servidor:

```bash
npm run start
```

**Passo 3.** No terminal do Expo aparecerá um **QR Code**. Instale o app **Expo Go** no
celular e abra esse QR Code com a câmera do próprio celular.

**Se o QR Code não funcionar** (rede da faculdade bloqueia, por exemplo), force o modo
túnel, que manda o tráfego pela internet em vez do Wi-Fi local:

```bash
npx expo start --tunnel
```

Leia o novo link com o Expo Go. Funciona em 4G, mas é mais lento.

**Pelo USB** (mais confiável que o Wi-Fi, não precisa da rede estar liberada):

```bash
npm run start
# em OUTRO terminal, com o cabo conectado e a depuração USB ativada no celular:
adb reverse tcp:8081 tcp:8081
```

> No Android, ative **Opções do desenvolvedor → Depuração USB**. Para ver essa opção,
> toque 7 vezes em **Número da build** em *Sobre do telefone*.

### 5.2 Opção B — Emulador Android pelo terminal (VS Code)

É a opção que você pediu: **controlar o emulador inteiro pelo CLI, sem abrir o Android
Studio para o dia a dia**. O Android Studio serve só para criar e configurar o dispositivo
virtual uma vez.

**Passo 1 — o emulador precisa existir.** Abra o Android Studio uma vez, vá em
`Device Manager` e crie um AVD chamado, por exemplo, `Pixel`. Se você já tem um, pule para
o passo 2.

**Passo 2 — descubra o nome do seu AVD:**

```bash
emulator -list-avds
```

Saída esperada neste projeto:

```
Pixel
PixelXLApi36
```

**Passo 3 — ligue o emulador rodando este comando e DEIXE O TERMINAL ABERTO:**

```bash
emulator -avd Pixel -no-snapshot-load
```

| Opção | Para quê |
| --- | --- |
| `-avd Pixel` | nome do dispositivo virtual (obrigatório) |
| `-no-snapshot-load` | inicializa do zero, sem o estado travado da última vez |
| `-no-boot-anim` | pula a animação de boot (inicia mais rápido) |
| `-gpu swiftshader_indirect` | render por software, resolve emuladores que travam na tela preta |
| `-no-snapshot-save` | não grava o estado ao sair (aula vai sujar menos o AVD) |

> Se `emulator` não for reconhecido, o SDK não está no `PATH`. Use o caminho completo:
> ```powershell
> & "C:\AndroidSDK\emulator\emulator.exe" -avd Pixel
> ```

**Passo 4 — espere o Android terminar de subir.** A janela do emulador aparecer não significa
que ele já está pronto. Espere aparecer o teclado e a tela inicial destravada, ou acompanhe:

```bash
adb wait-for-device
adb shell getprop sys.boot_completed
```

Quando imprimir `1`, o sistema está pronto.

**Passo 5 — confirme que o emulador foi reconhecido:**

```bash
adb devices
```

Esperado:

```
List of devices attached
emulator-5554    device
```

Se aparecer `offline` ou `unauthorized`, feche o emulador, rode `adb kill-server` e ligue de
novo.

**Passo 6 — suba o app:**

```bash
npm run android
```

Ou, se você quiser apenas o servidor e abrir o app manualmente (útil quando o
`--android` trava ou quando você já tem o app instalado):

```bash
npm run start
# e no terminal do Expo, pressione: a  (de "android")
```

**Resumo em uma linha só** (deixe o emulador rodando em um terminal):

```bash
emulator -avd Pixel -no-snapshot-load
```

```bash
npm run android
```

**Atalhos do terminal do Expo** (funcionam com `npm run start`):

| Tecla | Ação |
| --- | --- |
| `a` | Abre no Android (emulador ou dispositivo conectado) |
| `r` | Recarrega o app |
| `R` | Recarrega e limpa o cache do Metro |
| `m` | Abre o menu de desenvolvedor |
| `j` | Abre o debugger no navegador |
| `Ctrl + C` | Encerra o servidor |

### 5.3 Opção C — Emulador pelo Android Studio

1. Abra o Android Studio.
2. Em `Device Manager`, clique no ícone ▶️ do seu dispositivo virtual.
3. Espere o boot terminar.
4. No VS Code, em outro terminal:

   ```bash
   npm run android
   ```

O `emulator-5554` que o Android Studio abre é exatamente o mesmo que a opção B veria no
`adb devices` — os dois caminhos se misturam, e está tudo bem.

### 5.4 Opção D — Development build (necessário para background)

Tudo nas opções A, B e C roda no **Expo Go**, que é um app com um conjunto fixo de módulos
nativos. O rastreamento com a tela bloqueada depende de `expo-background-task`, que **não
está no Expo Go**.

Por isso o código do projeto tem a constante abaixo, em `app/(tabs)/rastrear.tsx`:

```ts
const USE_BACKGROUND_TASK = false; // true exige dev build — veja AGENTS.md
```

Para ligar esse recurso:

1. Instale o Android SDK completo (o do emulador já serve).
2. Crie a pasta nativa (o Expo gera, você não digita):

   ```bash
   npx expo prebuild --platform android
   ```

3. Compile e instale o app:

   ```bash
   npx expo run:android
   ```

4. Só depois da primeira compilação, mude a constante para `true` e recarregue com `r`.

> ⚠️ **O `npx expo run:android` é lento na primeira vez** (compila o projeto Gradle inteiro,
> pode levar vários minutos) e exige o Java JDK 17+. Não é necessário para a aula — só para
> a demonstração do serviço em segundo plano.
>
> ⚠️ **Leia o aviso no `AGENTS.md`:** o estado do treino ativo hoje vive na memória do
> módulo, e a task de background roda num contexto JavaScript separado. Se o sistema
> Android recriar o processo JS, a task não sabe qual treino está ativo. Antes de ligar a
> constante para a demonstração em sala, a task precisa buscar o treino ativo no banco.

---

## 6. Configurando o emulador Android

### 6.1 Criando um dispositivo virtual (uma vez só)

**Pela interface do Android Studio:**

1. `Tools > Device Manager`
2. `Create Virtual Device`
3. Escolha uma imagem da coluna **API 34** ou **API 36** que contenha **Google Play**
   (nome parecido com `Pixel 6` + `Google Play Intel x86_64 System Image`).
4. `Next > Finish`.

**Só pelo terminal** (útil se o Android Studio está pesado ou travado):

```bash
sdkmanager --list | findstr "system-images"
```

Baixe a imagem desejada:

```bash
sdkmanager "system-images;android-36;google_apis_playstore;x86_64"
```

Crie o AVD:

```bash
avdmanager create avd -n Pixel -k "system-images;android-36;google_apis_playstore;x86_64" -d pixel_6
```

### 6.2 Importante: escolha a imagem com Google Play

| Imagem | Google Maps no app |
| --- | --- |
| `google_apis_playstore` | ✅ funciona |
| `google_apis` | ⚠️ funciona, mas o Google Play Services pode faltar |
| `default` / `aosp` | ❌ **mapa em branco** |

Se o mapa do app aparecer como um retângulo cinza, é quase sempre isso.

### 6.3 Configurando o ambiente

O SDK precisa estar no `PATH`. Verifique:

```bash
adb version
emulator -list-avds
```

Se der "não reconhecido", adicione ao `PATH` do Windows:

```
%LOCALAPPDATA%\Android\Sdk\platform-tools
%LOCALAPPDATA%\Android\Sdk\emulator
%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest\bin
```

E defina a variável de ambiente `ANDROID_HOME` apontando para
`C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk` (ou para onde seu SDK estiver). Depois de
alterar variáveis de ambiente, **feche e abra o VS Code de novo**.

<details>
<summary><b>Detalhe: como o <code>adb</code> é resolvido no Windows</b></summary>

O Windows procura os executáveis na ordem do `PATH`. Se você tem o `adb` do `scrcpy`
instalado em outra pasta, ele pode ser encontrado **antes** do do Android SDK, e uma versão
mais antiga pode causear `unrecognized command`. Para ver qual está sendo usado:

```powershell
Get-Command adb
```

A saída mostra o caminho. Se não for o do SDK, chame pelo caminho completo:

```powershell
& "C:\AndroidSDK\platform-tools\adb.exe" devices
```

</details>

### 6.4 Acelerando o emulador

- **Aceleração de hardware**: em `Device Manager > Editar dispositivo > Show Advanced
  Settings > Graphics`, troque para **Hardware**. Se o emulador travar, volte para
  `Software` ou suba com `-gpu swiftshader_indirect`.
- **Resfriamento**: feche o emulador com `adb emu kill` em vez de fechar a janela, ou
  `emulator -avd Pixel -no-snapshot-save` para não gravar o estado.
- **Acelerar o boot** (imagem mais leve para aula):
  `emulator -avd Pixel -no-window` (roda sem janela, útil para CI) ou
  `emulator -avd Pixel -memory 2048 -cores 4`.

### 6.5 Enviando uma posição GPS para o emulador

O emulador não tem GPS de verdade. Para o app "enxergar" uma localização:

**Pela interface:** com o emulador aberto, clique no botão **⋮** (canto inferior direito) →
**Extended controls** → aba **Location** → digite latitude e longitude → **Send**.

**Pelo terminal:**

```bash
adb emu geo fix -46.6333 -23.5505
```

O par é `longitude latitude`, nessa ordem. O valor acima é São Paulo e é o mesmo centro do
mapa padrão do app.

> **Relembre:** o app ignora movimentos menores que 4 metros (`MIN_MOVE_METERS` em
> `rastrear.tsx`). Dois `geo fix` com a mesma coordenada não movem o traçado.

### 6.6 O que o emulador **não** simula

| Recurso | No emulador | Como testar de verdade |
| --- | --- | --- |
| Mapa / Google Maps | ✅ funciona (com imagem Google Play) | — |
| Câmera | ⚠️ câmera virtual; se falhar, o app cai para a galeria | celular físico |
| Contatos | ⚠️ lista vazia | celular físico, ou adicione contato pelo AVD Manager |
| GPS | ⚠️ precisa injetar via `adb emu geo fix` | celular físico ao ar livre |
| **Pedômetro** | ❌ não gera passos; o app mostra `--` | **celular físico** (caminhe!) |
| **Acelerômetro / shake** | ❌ sem vibração real | **celular físico** |
| **Bússola** | ❌ sem magnetômetro, a bússola não gira | **celular físico** |
| **Notificações** | ❌ **não funcionam no Expo Go (Android)** | ver o aviso em [7](#7-permissões-do-app) |
| Background com tela bloqueada | ❌ não existe no Expo Go | ver [5.4](#54-opção-d--development-build-necessário-para-background) |

Se a sua nota depende de pedômetro, bússola ou shake, você **precisa** do celular físico.

---

## 7. Permissões do app

O app pede permissões na hora em que a funcionalidade é usada, não tudo no começo. No Android os
textos que aparecem para o usuário estão em `app.json` (`android.permissions` e os plugins).

| Permissão | Quando é pedida | Para quê |
| --- | --- | --- |
| Localização (primeiro plano) | Ao tocar em **Iniciar percurso** | registrar o traçado |
| Localização (segundo plano) | Botão em Ajustes | continuar com a tela bloqueada |
| Notificações | Ao ativar o lembrete diário | lembrete de treino e aviso de conclusão |
| Câmera | Ao tocar em **Câmera** na tela do percurso | fotografar o trajeto |
| Fotos / mídia | Ao escolher a capa da rota ou foto do percurso | ler a galeria |
| Contatos | Ao tocar em **Enviar para contato** | escolher com quem compartilhar |
| Vibração | junto com o accelerometer | confirmar o marco registrado |

**Se você negou uma permissão por engano**, o caminho é: Ajustes do Android →
**Aplicativos** → **Rota RN** → **Permissões**. O botão **Abrir ajustes do sistema** dentro
do app faz isso direto.

> **Android 11+ e a localização em segundo plano:** o sistema não permite pedir
> "sempre permitir" junto com "só enquanto uso". Tem que ser em duas etapas. O app já
> trata isso: primeiro o primeiro plano, depois o botão em Ajustes. Nos Ajustes do sistema
> escolha **"Permitir o tempo todo"**, não "Só desta vez".

> ### ⚠️ Notificações não funcionam no Expo Go (Android)
>
> Este é o único recurso do app que **não roda** nas opções A, B e C, e não é um bug do
> projeto. A partir do SDK 53 o Expo Go removeu o `expo-notifications` no Android — e o
> módulo **lança erro já na importação**:
>
> ```
> expo-notifications: Android Push notifications ... was removed from Expo Go
> with the release of SDK 53. Use a development build instead of Expo Go.
> ```
>
> O serviço em `src/services/notifications.ts` carrega o módulo dentro de um `try/catch`,
> então o app **não quebra** — o lembrete diário e o aviso de "percurso finalizado"
> simplesmente não aparecem, e o terminal mostra um aviso explicando o motivo.
>
> Para ver as notificações funcionando, é preciso um development build
> ([5.4](#54-opção-d--development-build-necessário-para-background)). No Android com Expo Go
> elas não funcionam de forma alguma.

---

## 8. Tour pelo app, tela por tela

### 8.1 Aba **Rotas** (tela inicial)

Três indicadores no topo — **distância total**, **quantidade de percursos** e **tempo
total** — lidos do banco com `Promise.all`. Abaixo, a lista das suas rotas em `FlatList`,
com *pull to refresh*. O botão **Nova rota** fica fixo no rodapé.

Estado vazio tratado com `EmptyState`: nada de "Tela em branco".

### 8.2 Tela **Nova rota**

Formulário com nome, descrição, dificuldade (chips **Fácil / Média / Difícil**), distância,
desnível, botão **Usar minha localização** e **Escolher da galeria** para a capa. O botão
**Salvar rota** valida o nome antes de gravar.

### 8.3 Aba **Rastrear** — o coração do app

**Antes de começar:** escolha uma rota (opcional) ou deixe em **Percurso livre**, e veja a
bússola (`CompassDial`) funcionando.

**Ao iniciar:** o app grava o primeiro ponto, assina `watchPositionAsync` com
`Accuracy.High`, `distanceInterval: 4` m e `timeInterval: 3` s, e cada posição nova:

1. é filtrada por `isMeaningfulMove` (descarta ruído do GPS);
2. soma a distância com Haversine;
3. desenha o novo trecho do `Polyline`;
4. **persiste no SQLite** via `persistPoint`.

Durante o percurso você vê cronômetro, distância, velocidade média, passos, botão de **marco**
e o mapa acompanhando você. **Chacoalhar o celular** marca um ponto de interesse sozinho
(`useShake` + `addWaypoint`) e vibra como confirmação.

**Ao finalizar:** o resumo é salvo, dispara notificação e abre a tela do percurso.

Detalhe importante: **se você fechar o app no meio do percurso, ele continua salvo.** Ao
reabrir, a aba Rastrear encontra o treino ativo (`getActiveWorkout`) e retoma de onde parou.

### 8.4 Tela **Detalhe do percurso** (`/treino/[id]`)

Mapa com o traçado, marcadores de início e de cada marco, e seis indicadores: distância,
duração, passos, velocidade média, máxima e desnível acumulado (`elevationGain`, que ignora
variações menores que 1 m para não contar ruído). Tem **Compartilhar** (gera um `.txt` no
cache e chama o `expo-sharing`), **Enviar para contato**, **Câmera**, **Galeria** e
**Excluir percurso**.

### 8.5 Aba **Histórico**

Todos os percursos em ordem cronológica, com pílulas coloridas de distância, duração,
velocidade e passos. Se o percurso foi compartilhado, aparece para quem foi.

### 8.6 Tela **Enviar para contato** (`/contatos`)

Busca com *debounce* de 350 ms sobre os contatos do aparelho. Ao escolher um contato, o app
grava o compartilhamento no treino, lembra o contato em Ajustes e abre o app de SMS
(`sms:`) ou e-mail (`mailto:`) do sistema já endereçado.

### 8.7 Aba **Ajustes**

Unidades (km/mi), manter tela acesa, painel de permissões com o atalho para os ajustes do
sistema, lembrete diário e **Apagar todos os dados** (que zera as tabelas e reseta o
`sqlite_sequence`).

---

## 9. Matriz ementa → tecnologia

Use esta matriz para justificar cada tecnologia na sua análise. Ela cobre a ementa completa:

| Item da ementa | Onde está no código |
| --- | --- |
| Leiautes e componentes básicos | `src/components/` (`Screen`, `Card`, `AppButton`, `Pill`, `StatTile`, `FormField`, `EmptyState`) |
| Listas e imagens | `app/(tabs)/index.tsx`, `app/contatos.tsx` (`FlatList`); `app/rota/[id].tsx`, `app/treino/[id].tsx` (`Image`) |
| Navegação | `app/_layout.tsx` (Stack), `app/(tabs)/_layout.tsx` (Tabs), `router.push/replace/back` |
| Mapas | `app/(tabs)/rastrear.tsx`, `app/treino/[id].tsx`, `app/rota/[id].tsx` (`MapView`, `Polyline`, `Marker`) |
| Câmera e galeria | `app/rota/nova.tsx`, `app/treino/[id].tsx` (`expo-image-picker`) |
| Contatos | `app/contatos.tsx`, `src/services/contacts.ts` (`expo-contacts`, `expo-linking`) |
| Acelerômetro | `src/hooks/useShake.ts` (`Accelerometer`) |
| Bússola / giroscópio | `src/hooks/useCompass.ts` (`watchHeadingAsync`), `src/components/CompassDial.tsx` |
| Geolocalização | `src/hooks/usePermissions.ts`, `src/services/locationTask.ts` |
| Serviços em segundo plano | `src/services/locationTask.ts` (`expo-background-task`) |
| Notificações | `src/services/notifications.ts` |
| SQLite | `src/db/` (schema, migrações, repositórios) |
| Tratamento de erro | `Alert.alert` em todos os fluxos; `gpsError` na tela de rastreio |
| Boas práticas | tema centralizado em `src/theme/`, funções puras em `src/utils/` |

---

## 10. Estrutura do projeto

```
.
├── app/                          # ROTAS do Expo Router — cada arquivo é uma tela
│   ├── _layout.tsx               # Stack raiz: boot do SQLite + registro da task
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Navegador de abas
│   │   ├── index.tsx             # Aba "Rotas"
│   │   ├── rastrear.tsx          # Aba "Rastrear"
│   │   ├── historico.tsx         # Aba "Histórico"
│   │   └── ajustes.tsx           # Aba "Ajustes"
│   ├── rota/
│   │   ├── nova.tsx              # Formulário de nova rota
│   │   └── [id].tsx              # Detalhe da rota  ← colchete = parâmetro dinâmico
│   ├── treino/
│   │   └── [id].tsx              # Detalhe do percurso
│   └── contatos.tsx              # Escolha de contato
│
├── src/
│   ├── components/               # Componentes de apresentação
│   ├── db/                       # SQLite
│   │   ├── index.ts              # Singleton do banco + migrações
│   │   ├── schema.ts             # DDL e versões de migração
│   │   ├── routes.ts             # Repositório de rotas
│   │   ├── workouts.ts           # Repositório de percursos, pontos e marcos
│   │   ├── photos.ts             # Repositório de fotos
│   │   └── settings.ts           # Preferências
│   ├── hooks/                    # Hooks que integram módulos nativos
│   ├── services/                 # Efeitos colaterais do sistema
│   ├── theme/                    # Cores, espaçamentos, tipografia
│   ├── types/                    # Tipos de domínio
│   └── utils/                    # geo.ts (Haversine) e format.ts (puras, testáveis)
│
├── assets/                       # Ícones e splash
├── app.json                      # Configuração Expo: permissões e plugins
├── eslint.config.js              # ESLint 9 (flat config)
├── package.json                  # Dependências e scripts
└── tsconfig.json                 # TypeScript (alias @ → src)
```

**Três convenções importantes:**

1. **Rotas vivem em `app/`, na raiz** — não em `src/app/`. Tudo que está dentro de `app/` é
   tela; `_layout.tsx` define um navegador.
2. **Telas nunca escrevem SQL.** Toda leitura e escrita passa pelos repositórios em
   `src/db/`.
3. **Telas recarregam ao ganhar foco** com `useFocusEffect`, não `useEffect` — é o que faz
   a lista atualizar quando você volta do detalhe.

---

## 11. Banco de dados

SQLite local, sem servidor. O arquivo fica em `rota-rn.db`, na pasta de documentos do app.

**Como abrir o banco é seguro:** `getDatabase()` em `src/db/index.ts` é um *singleton* com
`Promise` memoizada. Quem chama sempre recebe a mesma conexão, e a `Promise` só resolve
depois que as migrações terminaram — por isso nenhuma tela precisa se preocupar com
"o banco ainda está abrindo".

**PRAGMAs obrigatórios:**

```sql
PRAGMA journal_mode = WAL;   -- leitura e escrita não se bloqueiam
PRAGMA foreign_keys = ON;    -- ON DE CASCADE realmente funciona
```

**Tabelas:**

| Tabela | Guarda | Relations |
| --- | --- | --- |
| `routes` | rotas cadastradas | — |
| `workouts` | percursos (status `ativo` ou `finalizado`) | → `routes` |
| `track_points` | cada ponto GPS do percurso | → `workouts` (CASCADE) |
| `photos` | fotos de rota e de percurso | → `workouts`, `routes` (CASCADE) |
| `waypoints` | marcos marcados | → `workouts` (CASCADE) |
| `settings` | preferências em chave/valor | — |

**Migrações versionadas.** A versão vive em `PRAGMA user_version`. Para evoluir o schema:

1. incremente `SCHEMA_VERSION` em `src/db/schema.ts`;
2. adicione a nova instrução ao final do array `MIGRATIONS`.

```ts
export const SCHEMA_VERSION = 2;

export const MIGRATIONS: string[] = [
  `CREATE TABLE ... `,   // v1 — nunca mais edite
  `ALTER TABLE ...`,     // v2 — novo
];
```

> ⚠️ **Nunca edite uma migração que já foi lançada.** Usuários que já rodaram a versão
> antiga nunca executariam a sua correção. Sempre acrescente a próxima.

---

## 12. Scripts disponíveis

| Comando | O que faz |
| --- | --- |
| `npm run start` | Sobe o servidor de desenvolvimento (QR Code) |
| `npm run android` | Sobe o servidor e abre no Android |
| `npm run typecheck` | `tsc --noEmit` — verifica os tipos |
| `npm run lint` | ESLint com as regras do Expo |
| `npm run doctor` | `expo-doctor`, 21 verificações de saúde do projeto |

Comandos extras úteis:

```bash
npx expo start --tunnel          # força o túnel (celular sem Wi-Fi liberado)
npx expo start --clear           # limpa o cache do Metro antes de subir
npx expo install <pacote>        # instala na versão correta do SDK
npx expo install --check         # confere se as versões batem
npx expo export --platform android --output-dir .smoke
```

**Rode sempre os três antes de entregar:**

```bash
npm run lint && npm run typecheck && npm run doctor
```

O último comando faz o *smoke test* sem precisar de emulador: ele gera o bundle de
produção e falha se algum `import` estiver quebrado.

---

## 13. Solução de problemas

<details>
<summary><b>"SDK location not found" / "Failed to connect to development server"</b></summary>

Quase sempre é o servidor não estar no ar ou o emulador não estar pronto.

```bash
adb devices                     # o aparelho aparece como "device"?
npm run start                   # o terminal mostra o QR Code?
```

Se `adb devices` mostrar `offline`, o emulador ainda está subindo:
`adb wait-for-device`.
</details>

<details>
<summary><b>Porta 8081 já em uso</b></summary>

Outro processo Metro está rodando. No terminal do Expo, pressione `Ctrl + C` e suba de novo.
Para achar e encerrar o culpado no Windows:

```powershell
Get-NetTCPConnection -LocalPort 8081 | Select-Object OwningProcess
Stop-Process -Id <id> -Force
```
</details>

<details>
<summary><b>Mapa em branco / cinza no emulador</b></summary>

A imagem de sistema do AVD não tem Google Play Services. Crie um AVD com
`google_apis_playstore` (veja [6.2](#62-importante-escolha-a-imagem-com-google-play)).
</details>

<details>
<summary><b>"Unable to resolve host" ou app abre em branco no celular</b></summary>

Rede da faculdade está bloqueando. Use o túnel:

```bash
npx expo start --tunnel
```
</details>

<details>
<summary><b>Alterações de código não aparecem</b></summary>

Cache do Metro. Pressione `r` no terminal, ou `R` para limpar tudo, ou na raiz:

```bash
npx expo start --clear
```
</details>

<details>
<summary><b>"The app is not connected to the Metro server"</b></summary>

Aperte `a` no terminal do Expo, ou reabra o app pelo Expo Go. Se estiver usando USB,
refaça o repasse de porta:

```bash
adb reverse tcp:8081 tcp:8081
```
</details>

<details>
<summary><b>Pedômetro mostra "--" e a bússola não gira</b></summary>

Você está no emulador. Esses sensores só existem em aparelho real — veja a tabela em
[6.6](#66-o-que-o-emulador-não-simula).
</details>

<details>
<summary><b>Erro de permissão de localização mesmo já tendo liberado</b></summary>

No Android 11+, "enquanto usa o app" e "sempre" são permissões separadas. Em Ajustes do
Android → Rota RN → Permissões → Localização, escolha **"Permitir o tempo todo"**.
</details>

<details>
<summary><b>Erro de tipo no VS Code mas `npm run typecheck` passa</b></summary>

O servidor de linguagem do TypeScript do VS Code guardou os tipos antigos. Abra a paleta
(Ctrl+Shift+P) e rode **TypeScript: Restart TS Server**.
</details>

<details>
<summary><b>Erro depois de instalar um pacote novo</b></summary>

```bash
npx expo install --check
npx expo install --fix
npm run doctor
```
</details>

---

## 14. Perguntas frequentes

**Posso rodar no navegador?**
Não. `react-native-maps` e o `expo-sqlite` web não sustentam este projeto, por isso o alvo
web não existe. É um app mobile.

**Preciso de chave de API do Google Maps?**
Não. O `react-native-maps` usa a chave que já vem embutida no Expo Go.

**Preciso de internet?**
Para instalar as dependências, sim. Depois disso, rodando em primeira plano, o app funciona
offline: o mapa precisa de internet para baixar os tiles, mas o rastreamento e o banco não.

**Como eu sei que está salvando de verdade?**
Rastree um percurso, finalize, abra a tela do percurso e olhe **Pontos gravados** em
*Detalhes*. Depois vá em **Ajustes > Apagar todos os dados** e veja o histórico zerar.

**Troquei de celular, perdi os dados?**
Sim. Tudo é local, sem nuvem. É proposital: o app não pede cadastro nem internet.

**Posso mudar o mapa para um estilo escuro?**
Pode. Em qualquer `MapView`, adicione `customMapStyle={DARK_STYLE}` com um array de estilos do
Google Maps, e o `userInterfaceStyle` do `app.json` já está como `automatic`.

**Como faço o app falar com uma API/servidor?**
O app é 100% local. Para adicionar rede, use `fetch` dentro de `src/services/` e nunca
dentro de um componente — o mesmo padrão dos outros serviços.

**Posso publicar na Play Store?**
Sim, com EAS Build. Não faz parte da ementa, mas é o próximo passo natural depois da aula
de banco de dados. A documentação está em <https://docs.expo.dev/eas/introduction/>.

---

## Licença

Material didático da disciplina de **Aplicativos Móveis (ETEC)**. Livre para uso acadêmico e
adaptação.
