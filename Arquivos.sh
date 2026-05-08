# =========================================
# CRIAR MONOREPO
# =========================================

mkdir lancheria-system
cd lancheria-system

# =========================================
# APPS
# =========================================

mkdir -p apps/totem
mkdir -p apps/admin
mkdir -p apps/kitchen
mkdir -p backend/api
mkdir -p packages/shared-types
mkdir -p packages/ui

# =========================================
# FRONTEND - TOTEM
# =========================================

mkdir -p apps/totem/src/app
mkdir -p apps/totem/src/components
mkdir -p apps/totem/src/features
mkdir -p apps/totem/src/services
mkdir -p apps/totem/src/hooks
mkdir -p apps/totem/src/store
mkdir -p apps/totem/src/types
mkdir -p apps/totem/src/lib
mkdir -p apps/totem/src/styles

touch apps/totem/src/app/page.tsx
touch apps/totem/src/app/layout.tsx
touch apps/totem/src/components/ProductCard.tsx
touch apps/totem/src/components/Cart.tsx
touch apps/totem/src/components/CategoryList.tsx
touch apps/totem/src/services/firebase.ts
touch apps/totem/src/store/cartStore.ts
touch apps/totem/src/types/product.ts

# =========================================
# FRONTEND - ADMIN
# =========================================

mkdir -p apps/admin/src/app
mkdir -p apps/admin/src/components
mkdir -p apps/admin/src/features
mkdir -p apps/admin/src/services
mkdir -p apps/admin/src/hooks
mkdir -p apps/admin/src/store
mkdir -p apps/admin/src/types
mkdir -p apps/admin/src/lib

touch apps/admin/src/app/page.tsx
touch apps/admin/src/app/layout.tsx
touch apps/admin/src/components/ProductForm.tsx
touch apps/admin/src/components/OrdersTable.tsx
touch apps/admin/src/services/firebase.ts
touch apps/admin/src/types/order.ts

# =========================================
# FRONTEND - KITCHEN
# =========================================

mkdir -p apps/kitchen/src/app
mkdir -p apps/kitchen/src/components
mkdir -p apps/kitchen/src/services
mkdir -p apps/kitchen/src/store
mkdir -p apps/kitchen/src/types

touch apps/kitchen/src/app/page.tsx
touch apps/kitchen/src/app/layout.tsx
touch apps/kitchen/src/components/KitchenOrders.tsx
touch apps/kitchen/src/services/firebase.ts
touch apps/kitchen/src/types/order.ts

# =========================================
# BACKEND API
# =========================================

mkdir -p backend/api/src
mkdir -p backend/api/src/modules
mkdir -p backend/api/src/modules/orders
mkdir -p backend/api/src/modules/products
mkdir -p backend/api/src/modules/auth
mkdir -p backend/api/src/common
mkdir -p backend/api/src/config
mkdir -p backend/api/src/firebase

touch backend/api/src/main.ts
touch backend/api/src/app.ts

touch backend/api/src/modules/orders/orders.controller.ts
touch backend/api/src/modules/orders/orders.service.ts
touch backend/api/src/modules/orders/orders.routes.ts

touch backend/api/src/modules/products/products.controller.ts
touch backend/api/src/modules/products/products.service.ts
touch backend/api/src/modules/products/products.routes.ts

touch backend/api/src/modules/auth/auth.controller.ts
touch backend/api/src/modules/auth/auth.service.ts
touch backend/api/src/modules/auth/auth.routes.ts

touch backend/api/src/firebase/firebase-admin.ts
touch backend/api/src/config/env.ts

# =========================================
# SHARED TYPES
# =========================================

mkdir -p packages/shared-types/src

touch packages/shared-types/src/product.ts
touch packages/shared-types/src/order.ts
touch packages/shared-types/src/user.ts
touch packages/shared-types/src/index.ts

# =========================================
# UI SHARED
# =========================================

mkdir -p packages/ui/src/components
mkdir -p packages/ui/src/styles

touch packages/ui/src/components/Button.tsx
touch packages/ui/src/components/Input.tsx
touch packages/ui/src/components/Card.tsx

# =========================================
# CONFIGURAÇÕES GERAIS
# =========================================

touch package.json
touch turbo.json
touch tsconfig.json
touch .gitignore
touch .env

# =========================================
# FIREBASE
# =========================================

mkdir firebase

touch firebase/firebase.json
touch firebase/firestore.rules
touch firebase/firestore.indexes.json

# =========================================
# DOCKER
# =========================================

touch Dockerfile
touch docker-compose.yml

# =========================================
# README
# =========================================

touch README.md

# =========================================
# GIT
# =========================================

git init

# =========================================
# .GITIGNORE
# =========================================

cat > .gitignore <<EOL
node_modules
.next
dist
build
.env
coverage
.firebase
EOL

# =========================================
# ESTRUTURA FINAL
# =========================================

echo "Estrutura MVP criada com sucesso!"