#!/usr/bin/env bash
set -euo pipefail

# WARNING: This script writes secrets to apps/.env.local. DO NOT commit apps/.env.local to git.
# Use this script locally to run the migration of images to Cloudinary.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/apps/.env.local"

cat > "$ENV_FILE" <<'ENV'
# Firebase Admin SDK (Server Side - NÃO USE NEXT_PUBLIC_)
FIREBASE_PROJECT_ID="totenatm"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@totenatm.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCyzfgtW5ebjdYB
/U89c3Y2uHC2ELrBOJdTJiXW50yX1LmF9/sFIZ/OUJO2tl4zMi8U44z1HjSvMAZ2
oqKTIhOqhdMCFCKNFTSeRdRJf3lokuDcl7LdgY8Mxh2jd9eYbzsMtk3TaARz1YJ1
aHEZ/+ccEGWCOv49mDYf73e36BYqrga0+8NDNmxyC+rXPE+kF7skw1BSYRTT1NZF
7iy/kcAG8gpshMxpm5SM93HmRe7bSc1nJ9dF5if46iSZo2B7a0KhNx27VG2q9C3w
bv7HHuSiBaZauLfc8gH8my3jw/23+2j+NKA4/7j5h3f46B5V/+ffjr2ocZ7GMT/G
NcmA9DdJAgMBAAECggEAAJHM4lIaHcX6Ikf9BmBVhk+Ylk/f1Gk6fCqRMMnMUeh8
zcswKsBEassRaWHT03xrr3iZFJfLyaoQvzR96ZOQdfjWpvlK8eGZKQ7mYfSMvbNI
EZPPH0sAGmWQJxrk3iiuirgS7+MzLm5F69tRDujkgs+fjyZidG5Fb90ap8SOu4SQ
hUYshDIgRATAJ43cV/AGMNE464/Cc1rc+5eQc/llUt735ZX8LwkroEtu2WTJwngf
qG9QCnLelm51DlEwYgbQ2RtIyacym88Eh8S6iirJozGhbOgoKhgcdu6mp/+/QxZo
Jr5ip0NQMIG/wO5hzhBpmTp1EMEONG1i5wSXYizgwQKBgQDohwGkQY5KvmrljxhO
Xa9Yd8Q+TICwLsSTIC7uPCYeqyJV4DEWu+pUY+4KXB3E6+uy1bEFSX5su8MaNFCl
QOZgFnb7N4CLzLF6QXzVxH466r+Roy+5tAPZZRDGRbn2RdcaQQ5yY7ZbQx2meSqf
Qhbu6rn5fRrTmGf84P4+FIwOqQKBgQDE2qdLAhhjv0JhMNJFlate4nL5wtH3+P1z
8xo+xdQeHnFBNHs8PpSKFy6hsnU8UjtNsk4S9+qZc6uAZtzBtYX1VsZlbXb42rux
zKx+XoI+buWql4yVnMnoxMYUp6lwztSb0GtJjPkZQfxaoP3lizZW5+LQyWO4f4h5
R1UZC9FnoQKBgFPWIVxkmnYOc6Iy1pOiqY7fF61Sje933T4ik2kn3KKgFzAZNfm5
ZQJqSTAJCF6wpPmEnF+IoQF5LR3skMsUPDuWve1TlJBTDAZFSEoWn2CEtO9Ag/uT
kPO3wbWK/EJz6ds4a4oIs33yE+WquBhVjskzbjwqxBpYT93YDTK628iJAoGBAK9f
5P6sJTJoKCkSJ6Kajov/zlK4v/rdNl/gSpd2A1253UgsC0ZGsmq78G1Z4ZwV3oN/
wJKhj72aEUZZXX6ty2QhJKsj9IQLyn/CSkJizEH25mEulq6Lek4HUDkCja/UdBFE
gvCJyTo5USsklk2z0ntmJum/ITozVFBHvoaLwslBAoGBAIw7vm97Z+EQCn7+uFcA
jZVRoAE9CqOIdblr3vtqq+vNwvSmCLPtr1/3O2B9IUzii0ruEVxyOluhqVJh3MzA
Tirn6rnCej9qrmyVCbM5MqWM4IPqhm3GCd8o3cKMtErIMRqOu7qJUTXh/tGSX5Uw
pj9GhgNUjLrCJ998/VrunnV7
-----END PRIVATE KEY-----"

# Firebase Client SDK (Public - OBRIGATÓRIO usar NEXT_PUBLIC_)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyC5yiYZsQbhWYPzNAKYFEpjzeT3Yl41Org"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="totenatm.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="totenatm"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="totenatm.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="919273037092"
NEXT_PUBLIC_FIREBASE_APP_ID="1:919273037092:web:1f9fa90c131f253f4aa7b1"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-Z7H89MQCTL"
 
CLOUDINARY_CLOUD_NAME="dqckenkgo"
CLOUDINARY_API_KEY="976281373821746"
CLOUDINARY_API_SECRET="ZJGALp1oaFun8APLpQ0VdT8RgJI"
ENV

chmod 600 "$ENV_FILE"

echo "Created $ENV_FILE (contains secrets)."

echo "Running migration script (requires ts-node). Using npx to avoid global installs."
cd "$ROOT_DIR"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx not found. Please install Node.js/npm or run the migration manually." >&2
  exit 1
fi

# Export variables from apps/.env.local into environment for the migration process
set -a
. "$ENV_FILE"
set +a

echo "Loaded env vars: CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME:-<missing>}"

npx ts-node scripts/migrate-images-to-cloudinary.ts

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo "Migration completed successfully."
else
  echo "Migration failed with exit code $EXIT_CODE." >&2
fi

# Reminder: remove apps/.env.local when done or keep it ignored by git

exit $EXIT_CODE
