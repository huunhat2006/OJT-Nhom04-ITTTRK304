# Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
#!/usr/bin/env bash
# ============================================================
# backup.sh — MySQL Backup Script for BTON
#
# Usage (manual):
#   chmod +x scripts/backup.sh
#   ./scripts/backup.sh
#
# Usage (automated via cron — daily at 02:00):
#   0 2 * * * /opt/bton/scripts/backup.sh >> /opt/bton/scripts/backup.log 2>&1
#
# Environment variables (read from .env if present):
#   MYSQL_HOST      — default: mysql (Docker service name)
#   MYSQL_PORT      — default: 3306
#   MYSQL_DATABASE  — default: bton_db
#   MYSQL_USER      — default: bton
#   MYSQL_PASSWORD  — required
#   BACKUP_DIR      — default: ./backups
#   BACKUP_RETAIN   — number of daily backups to keep (default: 7)
# ============================================================

set -euo pipefail

# ── Load .env if available ────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$ROOT_DIR/.env"

if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    set -a; source "$ENV_FILE"; set +a
fi

# ── Configuration ─────────────────────────────────────────────
MYSQL_HOST="${MYSQL_HOST:-mysql}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_DATABASE="${MYSQL_DATABASE:-bton_db}"
MYSQL_USER="${MYSQL_USER:-bton}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:?MYSQL_PASSWORD is required}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
BACKUP_RETAIN="${BACKUP_RETAIN:-7}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/bton_${MYSQL_DATABASE}_${TIMESTAMP}.sql.gz"

# ── Ensure backup directory exists ───────────────────────────
mkdir -p "$BACKUP_DIR"

echo "======================================"
echo " BTON Database Backup"
echo " Date    : $(date '+%Y-%m-%d %H:%M:%S')"
echo " Database: $MYSQL_DATABASE"
echo " Output  : $BACKUP_FILE"
echo "======================================"

# ── Run mysqldump (inside Docker if container is running) ─────
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "bton-mysql"; then
    echo "==> Using Docker container bton-mysql..."
    docker exec bton-mysql \
        mysqldump \
            --host=127.0.0.1 \
            --port=3306 \
            --user="$MYSQL_USER" \
            --password="$MYSQL_PASSWORD" \
            --single-transaction \
            --routines \
            --triggers \
            --set-gtid-purged=OFF \
            "$MYSQL_DATABASE" \
        | gzip -9 > "$BACKUP_FILE"
else
    echo "==> Using local mysqldump..."
    mysqldump \
        --host="$MYSQL_HOST" \
        --port="$MYSQL_PORT" \
        --user="$MYSQL_USER" \
        --password="$MYSQL_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        --set-gtid-purged=OFF \
        "$MYSQL_DATABASE" \
    | gzip -9 > "$BACKUP_FILE"
fi

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "==> Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# ── Rotate old backups (keep last N) ─────────────────────────
echo "==> Rotating backups (keeping last $BACKUP_RETAIN)..."
ls -t "$BACKUP_DIR"/bton_"${MYSQL_DATABASE}"_*.sql.gz 2>/dev/null \
    | tail -n +"$((BACKUP_RETAIN + 1))" \
    | xargs -r rm --
echo "==> Rotation complete. Current backups:"
ls -lh "$BACKUP_DIR"/bton_"${MYSQL_DATABASE}"_*.sql.gz 2>/dev/null || echo "   (none)"

echo "==> Done."
