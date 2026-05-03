#!/usr/bin/env bash
# Проброс портов из Minikube наружу
# Использование: ./k8s/port-forward.sh

set -euo pipefail

echo "Убиваю старые port-forward процессы..."
pkill -f "kubectl port-forward" 2>/dev/null || true
sleep 1

echo "Запускаю проброс портов..."

kubectl port-forward svc/frontend 8080:80 -n devops --address 0.0.0.0 &
echo "  Frontend:   http://0.0.0.0:8080"

kubectl port-forward svc/grafana 3001:3000 -n devops --address 0.0.0.0 &
echo "  Grafana:    http://0.0.0.0:3001  (admin/admin)"

kubectl port-forward svc/prometheus 9090:9090 -n devops --address 0.0.0.0 &
echo "  Prometheus: http://0.0.0.0:9090"

kubectl port-forward svc/backend 8082:8080 -n devops --address 0.0.0.0 &
echo "  Backend:    http://0.0.0.0:8082"

echo ""
echo "Все порты проброшены. Ctrl+C чтобы остановить."
wait
