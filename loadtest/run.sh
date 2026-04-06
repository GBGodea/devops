#!/usr/bin/env bash
set -euo pipefail

# ============================================
# JMeter Load Test Runner
# ============================================
# Использование:
#   ./loadtest/run.sh                     # localhost:8080, 120 сек
#   ./loadtest/run.sh localhost 8081      # кастомный хост/порт
#   ./loadtest/run.sh 192.168.49.2 30080  # напрямую по minikube ip
#
# Перед запуском убедись что port-forward работает:
#   kubectl port-forward svc/frontend 8080:80 -n devops --address 0.0.0.0 &

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
JMETER_VERSION="5.6.3"
JMETER_DIR="$SCRIPT_DIR/apache-jmeter-$JMETER_VERSION"
JMETER_TGZ="$SCRIPT_DIR/apache-jmeter-$JMETER_VERSION.tgz"
JMETER_BIN="$JMETER_DIR/bin/jmeter"

HOST="${1:-localhost}"
PORT="${2:-8080}"

# --- Скачать JMeter если нет ---
if [ ! -f "$JMETER_BIN" ]; then
    echo ">>> JMeter не найден, скачиваю v$JMETER_VERSION..."
    curl -fSL "https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-$JMETER_VERSION.tgz" \
        -o "$JMETER_TGZ"
    echo ">>> Распаковываю..."
    tar -xzf "$JMETER_TGZ" -C "$SCRIPT_DIR"
    rm -f "$JMETER_TGZ"
    echo ">>> JMeter установлен в $JMETER_DIR"
fi

# --- Проверка Java ---
if ! command -v java &>/dev/null; then
    echo "ОШИБКА: Java не найдена. Установи JRE/JDK:"
    echo "  sudo apt install -y default-jre"
    exit 1
fi

echo ""
echo "============================================"
echo " JMeter Load Test"
echo " Target: http://$HOST:$PORT"
echo " Threads: 50 GET + 10 POST"
echo " Duration: 120 seconds"
echo "============================================"
echo ""
echo ">>> Запускаю нагрузку..."
echo ">>> Следи за HPA: kubectl get hpa -n devops -w"
echo ""

"$JMETER_BIN" -n -t "$SCRIPT_DIR/test-plan.jmx" \
    -Jhost="$HOST" \
    -Jport="$PORT" \
    -l "$SCRIPT_DIR/results.jtl" \
    -e -o "$SCRIPT_DIR/report"

echo ""
echo ">>> Готово!"
echo ">>> Результаты: $SCRIPT_DIR/results.jtl"
echo ">>> HTML-отчёт: $SCRIPT_DIR/report/index.html"
