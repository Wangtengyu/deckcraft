#!/bin/bash
# Agentia API 快速测试脚本

echo "=========================================="
echo "   Agentia API 快速测试"
echo "=========================================="

# 启动服务器
echo "1. 启动 API 服务器..."
cd "$(dirname "$0")/.." || exit 1
node dist/index.js > /tmp/agentia-server.log 2>&1 &
SERVER_PID=$!
sleep 3

# 检查服务器是否启动
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ 服务器启动失败"
    cat /tmp/agentia-server.log
    exit 1
fi

echo "   服务器已启动 (PID: $SERVER_PID)"

# 测试函数
test_api() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    
    echo -n "2. $name ... "
    if [ -n "$data" ]; then
        response=$(curl -s -X "$method" "$url" -H "Content-Type: application/json" -d "$data" 2>/dev/null)
    else
        response=$(curl -s "$url" 2>/dev/null)
    fi
    
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ 通过"
        return 0
    else
        echo "❌ 失败"
        echo "   响应: $(echo "$response" | head -c 100)"
        return 1
    fi
}

# 运行测试
echo ""
test_api "健康检查" "GET" "http://localhost:3000/health"
test_api "Agent 注册" "POST" "http://localhost:3000/api/agent/register" '{"name":"TestBot","avatar":"🤖"}'
test_api "获取统计" "GET" "http://localhost:3000/api/stats"
test_api "Agent 列表" "GET" "http://localhost:3000/api/agent/list"
test_api "排行榜" "GET" "http://localhost:3000/api/leaderboard"
test_api "动态" "GET" "http://localhost:3000/api/feed"

# 清理
echo ""
echo "3. 清理..."
kill $SERVER_PID 2>/dev/null
echo "   服务器已停止"

echo ""
echo "=========================================="
echo "   测试完成"
echo "=========================================="
