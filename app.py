from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__)

HISTORY_FILE = 'history.json'

def load_history():
    """加载历史记录"""
    if not os.path.exists(HISTORY_FILE):
        return []
    with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_history(history):
    """保存历史记录"""
    with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

@app.route('/')
def index():
    """渲染计算器页面"""
    return render_template('index.html')

@app.route('/api/calculate', methods=['POST'])
def calculate():
    """
    计算接口
    请求体: {"num1": "10", "operator": "+", "num2": "5"}
    响应: {"result": "15", "expression": "10 + 5 = 15", "success": true}
    """
    data = request.get_json()
    
    # 参数校验
    num1 = data.get('num1', '')
    num2 = data.get('num2', '')
    operator = data.get('operator', '')
    
    if not all([num1, num2, operator]):
        return jsonify({
            'success': False,
            'error': '参数不完整'
        }), 400
    
    try:
        n1 = float(num1)
        n2 = float(num2)
    except ValueError:
        return jsonify({
            'success': False,
            'error': '非法数字格式'
        }), 400
    
    # 执行计算
    result = None
    error_msg = None
    
    if operator == '+':
        result = n1 + n2
    elif operator == '-':
        result = n1 - n2
    elif operator == '×' or operator == '*':
        result = n1 * n2
    elif operator == '÷' or operator == '/':
        if n2 == 0:
            error_msg = '除数不能为零'
        else:
            result = n1 / n2
    else:
        error_msg = '未知运算符'
    
    if error_msg:
        return jsonify({
            'success': False,
            'error': error_msg
        }), 400
    
    # 格式化结果（处理精度问题）
    result = round(result, 10)
    # 去掉末尾的 .0
    if result == int(result):
        result = int(result)
    
    expression = f"{num1} {operator} {num2} = {result}"
    
    # 保存历史记录
    history = load_history()
    history.insert(0, {
        'expression': expression,
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    })
    # 只保留最近 50 条
    history = history[:50]
    save_history(history)
    
    return jsonify({
        'success': True,
        'result': str(result),
        'expression': expression
    })

@app.route('/api/history', methods=['GET'])
def get_history():
    """获取计算历史"""
    history = load_history()
    return jsonify({
        'success': True,
        'data': history
    })

@app.route('/api/history/clear', methods=['POST'])
def clear_history():
    """清空历史记录"""
    save_history([])
    return jsonify({
        'success': True,
        'message': '历史记录已清空'
    })

if __name__ == '__main__':
    print("🧮 计算器后端服务启动中...")
    print("📍 服务地址: http://localhost:5000")
    print("📚 API 文档:")
    print("   GET  /               - 计算器页面")
    print("   POST /api/calculate  - 执行计算")
    print("   GET  /api/history    - 获取历史记录")
    print("   POST /api/history/clear - 清空历史记录")
    app.run(debug=True, host='0.0.0.0', port=5000)
