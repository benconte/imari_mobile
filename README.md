# Imari — Digital Banking & Financial Lifestyle App

> A next-generation mobile banking experience built with Expo & React Native.

Imari is a full-featured digital banking and financial lifestyle platform that brings together smart payments, savings automation, virtual cards, budget tracking, real-time analytics, and intelligent financial experiences into one unified mobile application.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🏦 **Wallet** | View balances, fund your wallet, and manage your money |
| 💸 **Transfers** | Send money to contacts or via QR code in seconds |
| 💳 **Virtual Cards** | Create and manage disposable virtual debit cards |
| 🏧 **Savings Vaults** | Set goals and automate savings with flexible scheduling |
| 📊 **Analytics** | Real-time spending breakdowns and financial insights |
| 💼 **Budget Manager** | Create category budgets and get alerts when approaching limits |
| 🔔 **Smart Notifications** | Real-time push + in-app WebSocket notification delivery |
| 🔒 **Biometric Lock** | Face ID / Fingerprint app lock screen with PIN fallback |
| 📷 **QR Payments** | Generate and scan QR codes for instant transfers |
| 🪪 **KYC Verification** | In-app identity verification with document capture |
| 👤 **Profile & Settings** | Manage profile, devices, notification preferences, and security |
| 🔐 **MFA Support** | TOTP-based two-factor authentication |

---

## 🏗️ Architecture

```
Expo (React Native + TypeScript)
  │
  ├── expo-router (file-based routing)       ← Navigation
  ├── @tanstack/react-query                  ← Server state / data fetching
  ├── zustand                                ← Client UI state
  ├── axios                                  ← HTTP client (auto token refresh)
  └── socket.io-client                       ← Real-time WebSocket events
```

The app communicates with the **Imari Backend** (NestJS REST API) at `https://api.imari.app/api/v1`.  
Real-time notifications are delivered via WebSockets. Push notifications are handled by Expo + FCM/APNs.

---

## 📦 Tech Stack

### Core
| Package | Version | Purpose |
|---|---|---|
| `expo` | ~54.0.33 | App runtime and build toolchain |
| `react-native` | 0.81.5 | Cross-platform native UI |
| `react` | 19.1.0 | UI rendering |
| `expo-router` | ~6.0.23 | File-based routing & navigation |
| `typescript` | ~5.9.2 | Type safety |

### Navigation
| Package | Version | Purpose |
|---|---|---|
| `@react-navigation/native` | ^7.1.8 | Navigation primitives |
| `@react-navigation/bottom-tabs` | ^7.4.0 | Bottom tab navigator |
| `@react-navigation/drawer` | ^7.10.2 | Side drawer navigator |
| `react-native-screens` | ~4.16.0 | Native screen containers |
| `react-native-safe-area-context` | ~5.6.0 | Safe area insets |

### Data & State
| Package | Version | Purpose |
|---|---|---|
| `@tanstack/react-query` | ^5.100.14 | Async server state management |
| `zustand` | ^5.0.13 | Lightweight global UI state |
| `axios` | ^1.16.1 | HTTP client with interceptors |
| `socket.io-client` | ^4.8.3 | WebSocket real-time connection |

### Expo Modules
| Package | Purpose |
|---|---|
| `expo-camera` | KYC document capture & QR scanning |
| `expo-image-picker` | Photo library access for KYC uploads |
| `expo-local-authentication` | Face ID / Fingerprint biometric lock |
| `expo-secure-store` | Encrypted token storage |
| `expo-notifications` | Push notification registration & handling |
| `expo-blur` | Blur effects (lock screen, modals) |
| `expo-haptics` | Tactile feedback on interactions |
| `expo-linear-gradient` | Gradient backgrounds & cards |
| `expo-font` | Custom font loading |
| `expo-sharing` | Share QR codes and receipts |
| `expo-clipboard` | Copy wallet addresses, transaction IDs |

### UI & Animation
| Package | Version | Purpose |
|---|---|---|
| `react-native-reanimated` | ~4.1.1 | High-performance animations |
| `react-native-gesture-handler` | ~2.28.0 | Native gestures |
| `react-native-svg` | ^15.15.5 | SVG rendering for charts & icons |
| `react-native-qrcode-svg` | ^6.3.21 | QR code generation |
| `react-native-view-shot` | 4.0.3 | Capture & share screen views |
| `expo-image` | ~3.0.11 | Optimized image rendering |
| `@expo/vector-icons` | ^15.0.3 | Icon library |

### Fonts
| Package | Purpose |
|---|---|
| `@expo-google-fonts/dm-sans` | Primary UI typeface |
| `@expo-google-fonts/dm-mono` | Monospaced numbers (balances, amounts) |

### Utilities
| Package | Version | Purpose |
|---|---|---|
| `date-fns` | ^4.3.0 | Date formatting and arithmetic |
| `@react-native-community/datetimepicker` | 8.4.4 | Native date/time pickers |

---

## 📁 File Tree

```
app/                                   ← Expo mobile application root
│
├── app/                               ← expo-router file-based routes
│   ├── _layout.tsx                    ← Root layout (Providers, deep links, WebSocket)
│   ├── index.tsx                      ← Entry redirect (auth guard)
│   ├── lock.tsx                       ← Biometric / PIN lock screen
│   ├── onboarding.tsx                 ← First-time onboarding flow
│   ├── auth/                          ← Public authentication screens
│   │   ├── _layout.tsx
│   │   ├── login.tsx                  ← Login with email/phone + password
│   │   ├── register.tsx               ← New account registration
│   │   ├── verify-otp.tsx             ← OTP email verification
│   │   └── forgot.tsx                 ← Forgot password flow
│   └── (app)/                         ← Protected app shell (requires auth)
│       ├── _layout.tsx                ← Drawer layout + auth guard
│       ├── analytics.tsx              ← Financial analytics overview
│       ├── budget.tsx                 ← Budget list + category manager
│       ├── edit-profile.tsx           ← Edit user profile
│       ├── kyc-pending.tsx            ← KYC awaiting review screen
│       ├── notification-preferences.tsx
│       ├── notifications.tsx          ← Notification inbox
│       ├── profile.tsx                ← User profile & account info
│       ├── settings.tsx               ← App settings (security, theme, etc.)
│       ├── subscriptions.tsx          ← Subscription tracker
│       ├── (tabs)/                    ← Bottom tab navigator
│       │   ├── _layout.tsx
│       │   ├── home.tsx               ← Dashboard / home screen
│       │   ├── wallet.tsx             ← Wallet & balance overview
│       │   ├── transactions.tsx       ← Transaction history
│       │   ├── savings.tsx            ← Savings vaults list
│       │   └── cards.tsx              ← Virtual cards management
│       ├── analytics/                 ← Analytics detail screens
│       ├── budget/                    ← Budget detail & creation
│       ├── cards/                     ← Virtual card detail
│       ├── kyc/                       ← KYC identity verification flow
│       ├── qr/                        ← QR code show/scan screens
│       ├── savings/                   ← Vault detail & creation
│       ├── settings/                  ← Settings sub-screens
│       ├── transaction/               ← Transaction detail screen
│       ├── transfer/                  ← Send/receive money flow
│       └── wallet/                    ← Wallet fund & withdraw flow
│
├── src/                               ← Application source (non-route)
│   ├── components/                    ← Reusable UI components
│   │   ├── ui/                        ← Base design system (Toast, Button, etc.)
│   │   ├── layout/                    ← Layout wrappers & containers
│   │   ├── navigation/                ← Navigation-specific components
│   │   ├── wallet/                    ← Wallet-specific widgets
│   │   ├── transaction/               ← Transaction list items & cards
│   │   ├── transfer/                  ← Transfer form components
│   │   ├── savings/                   ← Savings vault components
│   │   ├── cards/                     ← Virtual card display components
│   │   ├── budget/                    ← Budget chart & category components
│   │   ├── analytics/                 ← Charts and analytics widgets
│   │   └── notifications/             ← Notification item components
│   ├── hooks/                         ← Custom React hooks (data + logic)
│   │   ├── useAuth.ts                 ← Auth state from secure store
│   │   ├── useWallet.ts               ← Wallet queries & mutations
│   │   ├── useTransactions.ts         ← Transaction list & filters
│   │   ├── useTransfer.ts             ← Transfer initiation & status
│   │   ├── useSavings.ts              ← Savings vault CRUD
│   │   ├── useVirtualCards.ts         ← Virtual card management
│   │   ├── useBudget.ts               ← Budget category management
│   │   ├── useBeneficiaries.ts        ← Saved contacts / beneficiaries
│   │   ├── useNotifications.ts        ← Push + WebSocket notifications
│   │   ├── useProfile.ts              ← User profile queries
│   │   ├── useKYC.ts                  ← KYC submission & status
│   │   ├── useQR.ts                   ← QR code generation
│   │   ├── useDevices.ts              ← Trusted device management
│   │   ├── useWalletPin.ts            ← Wallet PIN set/verify
│   │   └── useAppReady.ts             ← Splash screen & font loading
│   ├── lib/                           ← Core utilities
│   │   ├── api.ts                     ← Axios client (auto token refresh)
│   │   ├── constants.ts               ← App-wide constants
│   │   ├── storage.ts                 ← expo-secure-store wrapper
│   │   ├── device.ts                  ← Device fingerprint helpers
│   │   └── queryClient.ts             ← TanStack Query client config
│   ├── providers/                     ← React context providers
│   ├── stores/                        ← Zustand global stores
│   │   └── ui.store.ts                ← Toast, modal, loading state
│   ├── theme/                         ← Design tokens & theme config
│   ├── types/                         ← TypeScript type definitions
│   ├── constants/                     ← Feature-level constants
│   └── mocks/                         ← Development mock data
│
├── assets/                            ← Static assets (icons, images, fonts)
├── android/                           ← Native Android project
├── app.json                           ← Expo configuration
├── package.json                       ← Dependencies & scripts
├── tsconfig.json                      ← TypeScript configuration
├── metro.config.js                    ← Metro bundler config
└── eslint.config.js                   ← ESLint configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20
- **npm** or **yarn**
- **Expo Go** (for quick preview) or a physical device / emulator
- Android Studio (for Android) or Xcode (for iOS)

### 1. Clone & Install

```bash
git clone https://github.com/block-industries/imari.git
cd imari/app
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
EXPO_PUBLIC_API_URL=https://api.imari.app/api/v1
```

For local backend development:

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api/v1
```

> ⚠️ Use your LAN IP (not `localhost`) when connecting to a local backend from a physical device.

### 3. Start the App

```bash
# Start Expo dev server
npx expo start

# Run on Android (emulator or device)
npx expo run:android

# Run on iOS simulator
npx expo run:ios
```

---

## 🔐 Security Architecture

- **Token Storage** — Access & refresh tokens stored in `expo-secure-store` (hardware-backed encryption)
- **Auto Token Refresh** — Axios interceptor transparently refreshes expired access tokens (15m window)
- **Biometric Lock** — App-level lock screen using Face ID / Fingerprint (backed by `expo-local-authentication`)
- **Wallet PIN** — Additional transaction-level PIN protection
- **Deep Links** — Custom scheme `imari://` with auth guard before routing
- **Device Registration** — Each install registers a device fingerprint with the backend

---

## 📱 Permissions

| Permission | Platform | Reason |
|---|---|---|
| Camera | iOS & Android | QR code scanning, KYC document capture |
| Photo Library | iOS & Android | KYC document upload from gallery |
| Face ID | iOS | App lock biometric authentication |
| Biometrics / Fingerprint | Android | App lock biometric authentication |
| Notifications | iOS & Android | Push notification delivery |

---

## 🧩 Key Patterns

- **File-based Routing** — `expo-router` with nested layouts: `(tabs)` inside `(app)` with drawer navigation
- **Server State** — All API data managed by TanStack Query with automatic caching & background refetch
- **Client State** — `zustand` for UI-only state (toast messages, modals, theme override)
- **Optimistic Updates** — Mutations use optimistic updates for instant UI feedback
- **Real-time** — WebSocket connection via `socket.io-client` delivers live notifications
- **Code Splitting** — Expo Router lazy-loads each route segment automatically

---

## 🛠️ Scripts

| Command | Description |
|---|---|
| `npm start` | Start Metro bundler (Expo dev server) |
| `npm run android` | Build & run on Android |
| `npm run ios` | Build & run on iOS |
| `npm run web` | Run in browser (Expo web) |
| `npm run lint` | Lint with ESLint |
| `npm run reset-project` | Reset project to blank starter |

---

## 🌐 Backend

The Imari backend is a **NestJS** REST API located in `/imari_backend`.

| Service | URL |
|---|---|
| API Base | `http://localhost:3000/api/v1` |
| Swagger UI | `http://localhost:3000/api/v1/docs` |
| ReDoc | `http://localhost:3000/redoc` |
| MailHog | `http://localhost:8025` |

See [`/imari_backend/README.md`](../imari_backend/README.md) for full backend setup.

---

## 📄 License

Private — All rights reserved © Block Industries
