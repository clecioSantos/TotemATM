# Android Setup — Bora Delivery

Configuração do aplicativo Android via Capacitor.

---

## Pré-requisitos

- Node.js 18+
- Android Studio (para build nativo)
- Java 17+ (JDK)
- Android SDK (gerenciado pelo Android Studio)

---

## Como gerar APK

```bash
# 1. Sincronizar a web app com o projeto Android
npx cap sync android

# 2. Abrir no Android Studio
npx cap open android

# 3. No Android Studio:
#    Build → Build Bundle(s) / APK(s) → Build APK(s)
#    O APK será gerado em: android/app/build/outputs/apk/debug/
```

---

## Como gerar AAB (Google Play)

```bash
# 1. Build de produção do Next.js
npm run build

# 2. Sincronizar com Android
npx cap sync android

# 3. No Android Studio:
#    Build → Generate Signed Bundle / APK → Android App Bundle
#    Siga o wizard de assinatura
```

---

## Como abrir no Android Studio

```bash
npx cap open android
```

Isso abre o projeto `android/` no Android Studio para compilação e deploy.

---

## Como trocar o ícone do app

Os ícones estão em:

```
android/app/src/main/res/mipmap-mdpi/
android/app/src/main/res/mipmap-hdpi/
android/app/src/main/res/mipmap-xhdpi/
android/app/src/main/res/mipmap-xxhdpi/
android/app/src/main/res/mipmap-xxxhdpi/
```

Para substituir:

1. Gere imagens nos tamanhos:
   - mdpi: 48x48
   - hdpi: 72x72
   - xhdpi: 96x96
   - xxhdpi: 144x144
   - xxxhdpi: 192x192

2. Adaptive icon (Android 8+):
   - `mipmap-anydpi-v26/ic_launcher.xml`
   - `mipmap-anydpi-v26/ic_launcher_foreground.xml` (foreground layer)
   - `drawable/ic_launcher_background.xml` (background color/layer)

Substitua os arquivos nas pastas correspondentes e execute:

```bash
npx cap sync android
```

---

## Como trocar a Splash Screen

Configurado em `capacitor.config.ts`:

```typescript
SplashScreen: {
  launchShowDuration: 2000,
  backgroundColor: "#FF6B00",
  androidSplashResourceName: "splash",
  androidScaleType: "CENTER_CROP",
  showSpinner: false,
}
```

Para alterar a imagem da splash:

1. Coloque a imagem em `android/app/src/main/res/drawable/splash.png`
2. Execute `npx cap sync android`

---

## Como publicar na Google Play Store

1. Gere um **Android App Bundle (AAB)** assinado:
   ```bash
   npx cap open android
   # Build → Generate Signed Bundle / APK → Android App Bundle
   ```

2. Acesse [Google Play Console](https://play.google.com/console/)

3. Crie um novo aplicativo ou selecione o existente

4. Vá em **Produção → Criar novo lançamento**

5. Faça upload do arquivo `.aab` gerado

6. Preencha as informações da loja (descrição, screenshots, etc.)

7. Revise e publique

---

## Como atualizar o app (modo web)

Como o aplicativo carrega a URL online (`server.url`), **não é necessário gerar um novo APK** para atualizações de funcionalidades. Basta fazer deploy do site normalmente.

O APK precisa ser atualizado APENAS quando houver mudanças em:

- Plugins Capacitor
- Permissões Android
- Configurações nativas
- Splash screen
- Ícone do app

---

## Como ativar notificações push futuramente

1. Configure o Firebase Cloud Messaging no console Firebase

2. No `capacitor.config.ts`, ajuste as configurações de PushNotifications

3. Adicione o arquivo `google-services.json` do Firebase em:
   ```
   android/app/google-services.json
   ```

4. Descomente/implemente o envio de token no `notification.service.ts`

5. Execute:
   ```bash
   npx cap sync android
   ```

---

## Permissões utilizadas

| Permissão | Finalidade | Arquivo |
|-----------|------------|---------|
| `ACCESS_FINE_LOCATION` | Geolocalização para endereço de entrega | `AndroidManifest.xml` |
| `ACCESS_COARSE_LOCATION` | Geolocalização aproximada | `AndroidManifest.xml` |
| `CAMERA` | Tirar foto do produto | `AndroidManifest.xml` |
| `INTERNET` | Acesso à internet (obrigatório) | `AndroidManifest.xml` |
| `POST_NOTIFICATIONS` | Notificações push (Android 13+) | Plugin Capacitor |
| `VIBRATE` | Vibração em notificações | Plugin Capacitor |

---

## Deep Links

O app suporta deep links no formato:

```
boradelivery://produto/123
boradelivery://loja/456
boradelivery://pedido/789
```

A arquitetura está preparada em `src/capacitor/deep-links.ts`.  
Para ativar, é necessário configurar no console Firebase:

1. Acesse **Dynamic Links** ou configure **Android App Links**
2. Adicione o domínio `boradelivery.com` ao `assetlinks.json`

---

## Solução de problemas comuns

### `npx cap sync` falha com "webDir not found"

```bash
mkdir out && npx cap sync android
```

### App não carrega, mostra tela branca

1. Verifique se a URL em `capacitor.config.ts > server.url` está correta
2. Verifique se o domínio permite HTTPS
3. No Android Studio, veja o Logcat para erros do WebView

### Botão voltar não funciona

Verifique se `src/capacitor/back-button.ts` foi importado corretamente no layout.
O `CapacitorInit` deve estar presente no `app/layout.tsx`.

### Geolocalização não funciona

1. Verifique se a permissão `ACCESS_FINE_LOCATION` está no `AndroidManifest.xml`
2. No Android 11+, a permissão precisa ser solicitada em tempo de execução
3. O `locationService.requestPermissions()` já faz isso

---

## Arquivos criados/modificados

### Criados

| Arquivo | Descrição |
|---------|-----------|
| `capacitor.config.ts` | Configuração do Capacitor |
| `src/capacitor/platform.ts` | Detecção de plataforma (Android/iOS/Web) |
| `src/capacitor/back-button.ts` | Comportamento inteligente do botão voltar |
| `src/capacitor/external-links.ts` | Abertura de links externos |
| `src/capacitor/location.service.ts` | Geolocalização unificada |
| `src/capacitor/image.service.ts` | Captura de imagem/câmera |
| `src/capacitor/notification.service.ts` | Arquitetura de notificações push |
| `src/capacitor/network-monitor.ts` | Monitoramento de conexão |
| `src/capacitor/deep-links.ts` | Deep links |
| `src/capacitor/capacitor-init.tsx` | Inicialização dos serviços |
| `android/` | Projeto Android gerado pelo Capacitor |

### Modificados

| Arquivo | Alteração |
|---------|-----------|
| `app/layout.tsx` | Adicionado `CapacitorInit`, viewport meta, theme-color |
| `next.config.js` | Adicionado `skipTrailingSlashRedirect` e headers de segurança |
| `package.json` | Adicionadas dependências `@capacitor/*` |

### Dependências instaladas

```
@capacitor/core
@capacitor/cli
@capacitor/android
@capacitor/splash-screen
@capacitor/device
@capacitor/network
@capacitor/app
@capacitor/browser
@capacitor/geolocation
@capacitor/camera
@capacitor/dialog
@capacitor/push-notifications
@capacitor/filesystem
@capacitor/preferences
```

---

## Possíveis melhorias futuras

- [ ] Adicionar `google-services.json` para notificações push
- [ ] Configurar Android App Links para deep links
- [ ] Adicionar tela nativa de onboarding
- [ ] Implementar cache offline via Service Worker
- [ ] Adicionar analytics nativo (Firebase Analytics Android SDK)
- [ ] Suporte a widgets Android
- [ ] Suporte a Google Pay
