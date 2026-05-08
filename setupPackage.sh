#!/bin/bash

echo "====================================="
echo "CONFIGURANDO NEXORDER MONOREPO"
echo "====================================="

mkdir -p apps/admin
mkdir -p apps/totem
mkdir -p apps/kitchen
mkdir -p backend/api

echo "====================================="
echo "CRIANDO PACKAGE ROOT"
echo "====================================="

cat > package.json <<EOF
{
  "name": "nexorder",
  "private": true,
  "packageManager": "npm@11.12.1",

  "workspaces": [
    "apps/*",
    "backend/*"
  ],

  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint"
  },

  "devDependencies": {
    "turbo": "^2.9.9",
    "typescript": "^5.0.0"
  }
}
EOF

echo "====================================="
echo "CRIANDO TURBO.JSON"
echo "====================================="

cat > turbo.json <<EOF
{
  "\$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        ".next/**",
        "dist/**"
      ]
    }
  }
}
EOF

echo "====================================="
echo "CRIANDO ADMIN"
echo "====================================="

cat > apps/admin/package.json <<EOF
{
  "name": "admin",
  "private": true,

  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build"
  },

  "dependencies": {
    "next": "^15.5.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
EOF

mkdir -p apps/admin/app

cat > apps/admin/app/layout.tsx <<EOF
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
EOF

cat > apps/admin/app/page.tsx <<EOF
export default function HomePage() {
  return (
    <main style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '48px',
      fontWeight: 'bold'
    }}>
      NexOrder Admin
    </main>
  );
}
EOF

echo "====================================="
echo "CRIANDO TOTEM"
echo "====================================="

cat > apps/totem/package.json <<EOF
{
  "name": "totem",
  "private": true,

  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build"
  },

  "dependencies": {
    "next": "^15.5.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
EOF

mkdir -p apps/totem/app

cat > apps/totem/app/layout.tsx <<EOF
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
EOF

cat > apps/totem/app/page.tsx <<EOF
export default function HomePage() {
  return (
    <main style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '48px',
      fontWeight: 'bold'
    }}>
      NexOrder Totem
    </main>
  );
}
EOF

echo "====================================="
echo "CRIANDO KITCHEN"
echo "====================================="

cat > apps/kitchen/package.json <<EOF
{
  "name": "kitchen",
  "private": true,

  "scripts": {
    "dev": "next dev -p 3002",
    "build": "next build"
  },

  "dependencies": {
    "next": "^15.5.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
EOF

mkdir -p apps/kitchen/app

cat > apps/kitchen/app/layout.tsx <<EOF
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
EOF

cat > apps/kitchen/app/page.tsx <<EOF
export default function HomePage() {
  return (
    <main style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '48px',
      fontWeight: 'bold'
    }}>
      NexOrder Kitchen
    </main>
  );
}
EOF

echo "====================================="
echo "INSTALANDO DEPENDÊNCIAS"
echo "====================================="

npm install

echo "====================================="
echo "FINALIZADO"
echo "====================================="
echo ""
echo "Execute:"
echo "npm run dev"
echo ""
echo "Admin:"
echo "http://localhost:3000"
echo ""
echo "Totem:"
echo "http://localhost:3001"
echo ""
echo "Kitchen:"
echo "http://localhost:3002"