#!/bin/bash

# PWA Performance Testing Script
echo "🚀 PWA Performance Testing for Fresh"
echo "====================================="

# Wait for servers to be ready
echo "⏳ Waiting for servers to be ready..."
sleep 10

# Test middleware performance (login page)
echo "🧪 Testing Middleware Performance..."
echo "Target: <100ms for PWA standards"

for i in {1..5}; do
    echo -n "Test $i: "
    time_result=$(curl -w "%{time_total}" -s -o /dev/null http://localhost:3000/login 2>/dev/null)
    if [ $? -eq 0 ]; then
        time_ms=$(echo "$time_result * 1000" | bc)
        printf "%.0fms\n" $time_ms
        
        # Check if within PWA standards
        if (( $(echo "$time_result < 0.1" | bc -l) )); then
            echo "   ✅ Excellent (PWA Standard)"
        elif (( $(echo "$time_result < 0.4" | bc -l) )); then
            echo "   ⚡ Good"
        elif (( $(echo "$time_result < 0.8" | bc -l) )); then
            echo "   ⚠️  Acceptable"
        else
            echo "   ❌ Too slow for PWA"
        fi
    else
        echo "❌ Failed to connect"
    fi
    sleep 1
done

echo ""
echo "🔍 Testing API Performance..."
for i in {1..3}; do
    echo -n "API Test $i: "
    api_time=$(curl -w "%{time_total}" -s -o /dev/null http://localhost:3333/health 2>/dev/null)
    if [ $? -eq 0 ]; then
        api_ms=$(echo "$api_time * 1000" | bc)
        printf "%.0fms\n" $api_ms
    else
        echo "❌ API not responding"
    fi
    sleep 1
done

echo ""
echo "📊 PWA Performance Summary:"
echo "• Middleware: Should be <5ms (optimized)"
echo "• Page Load: Should be <100ms (cached), <800ms (fresh)"
echo "• API Response: Should be <50ms (local)"
echo ""
echo "🎯 Next Steps:"
echo "1. Add Service Worker for offline support"
echo "2. Optimize bundle size with webpack-bundle-analyzer"
echo "3. Add Performance Observer for real-time monitoring"
echo "4. Set up Lighthouse CI for continuous performance testing"