class Calculator {
    constructor(previousOperandElement, currentOperandElement) {
        this.previousOperandElement = previousOperandElement;
        this.currentOperandElement = currentOperandElement;
        this.clear();
        this.loadHistory();
    }

    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.waitingForOperand = false;
    }

    delete() {
        if (this.waitingForOperand) return;
        if (this.currentOperand === '0') return;
        if (this.currentOperand.length === 1) {
            this.currentOperand = '0';
        } else {
            this.currentOperand = this.currentOperand.slice(0, -1);
        }
    }

    appendNumber(number) {
        if (this.waitingForOperand) {
            this.currentOperand = '';
            this.waitingForOperand = false;
        }
        
        if (number === '.' && this.currentOperand.includes('.')) return;
        
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number.toString();
        } else {
            this.currentOperand = this.currentOperand.toString() + number.toString();
        }
    }

    chooseOperation(operation) {
        if (this.currentOperand === '') return;
        
        // 如果已经有前一个操作数和运算符，进行本地累积计算
        if (this.previousOperand !== '' && this.operation !== undefined) {
            const prev = parseFloat(this.previousOperand);
            const current = parseFloat(this.currentOperand);
            let result;
            
            switch(this.operation) {
                case '+':
                    result = prev + current;
                    break;
                case '-':
                    result = prev - current;
                    break;
                case '×':
                    result = prev * current;
                    break;
                case '÷':
                    result = current !== 0 ? prev / current : prev;
                    break;
                default:
                    result = current;
            }
            
            // 处理精度
            result = Math.round(result * 100000000) / 100000000;
            this.previousOperand = result.toString();
        } else {
            this.previousOperand = this.currentOperand;
        }
        
        this.operation = operation;
        this.waitingForOperand = true;
        this.currentOperand = '0';
    }

    computeLocal() {
        this.updateDisplay();
    }

    // 调用后端 API 计算
    async compute() {
        if (this.operation === undefined || this.previousOperand === '') return;

        try {
            // 显示加载状态
            this.currentOperandElement.innerHTML = '<span class="loading"></span>';

            const response = await fetch('/api/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    num1: this.previousOperand,
                    num2: this.currentOperand === '0' && this.waitingForOperand ? this.previousOperand : this.currentOperand,
                    operator: this.operation
                })
            });

            const data = await response.json();

            if (data.success) {
                this.currentOperand = data.result;
                this.operation = undefined;
                this.previousOperand = '';
                this.waitingForOperand = false;
                
                // 重新加载历史记录
                this.loadHistory();
                
                // 添加结果淡入动画
                setTimeout(() => {
                    this.currentOperandElement.classList.add('result-fade-in');
                    setTimeout(() => {
                        this.currentOperandElement.classList.remove('result-fade-in');
                    }, 300);
                }, 50);
            } else {
                // 显示错误并添加抖动效果
                this.currentOperandElement.innerText = data.error;
                this.currentOperandElement.classList.add('error-shake');
                setTimeout(() => {
                    this.currentOperandElement.classList.remove('error-shake');
                    this.clear();
                }, 1000);
            }
        } catch (error) {
            console.error('计算错误:', error);
            this.currentOperandElement.innerText = '网络错误';
            setTimeout(() => this.clear(), 1000);
        }
    }

    // 格式化数字显示
    getDisplayNumber(number) {
        if (typeof number === 'string' && number.includes('<')) return number; // loading HTML
        
        const stringNumber = number.toString();
        
        // 超长数字使用科学计数法
        if (stringNumber.length > 15) {
            const num = parseFloat(stringNumber);
            if (!isNaN(num)) {
                return num.toExponential(6);
            }
        }
        
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        let integerDisplay;
        
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerDigits.toLocaleString('zh-CN', {
                maximumFractionDigits: 0
            });
        }
        
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }

    updateDisplay() {
        this.currentOperandElement.innerText = this.getDisplayNumber(this.currentOperand);
        
        // 根据数字长度智能调整字体大小
        const length = this.currentOperand.toString().length;
        this.currentOperandElement.classList.remove('long-number', 'very-long-number');
        
        if (length > 15) {
            this.currentOperandElement.classList.add('very-long-number');
        } else if (length > 10) {
            this.currentOperandElement.classList.add('long-number');
        }
        
        if (this.operation != null) {
            this.previousOperandElement.innerText = 
                `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            this.previousOperandElement.innerText = '';
        }
    }

    // 加载历史记录
    async loadHistory() {
        try {
            const response = await fetch('/api/history');
            const result = await response.json();
            
            const historyList = document.getElementById('history-list');
            
            if (result.success && result.data.length > 0) {
                historyList.innerHTML = result.data.map(item => `
                    <div class="history-item" onclick="useHistoryResult('${item.expression.split(' = ')[1]}')">
                        <div>${item.expression}</div>
                        <div class="time">${item.timestamp}</div>
                    </div>
                `).join('');
            } else {
                historyList.innerHTML = '<div class="history-empty">暂无记录</div>';
            }
        } catch (error) {
            console.error('加载历史失败:', error);
        }
    }

    // 清空历史记录
    async clearHistory() {
        if (!confirm('确定要清空所有历史记录吗？')) return;
        
        try {
            const response = await fetch('/api/history/clear', {
                method: 'POST'
            });
            const result = await response.json();
            
            if (result.success) {
                this.loadHistory();
            }
        } catch (error) {
            console.error('清空历史失败:', error);
        }
    }
}

// ==================== 初始化 ====================

const previousOperandElement = document.querySelector('.previous-operand');
const currentOperandElement = document.querySelector('.current-operand');
const calculator = new Calculator(previousOperandElement, currentOperandElement);

// 历史记录回填功能
function useHistoryResult(result) {
    calculator.currentOperand = result;
    calculator.waitingForOperand = false;
    calculator.updateDisplay();
}

// 数字按钮
document.querySelectorAll('[data-number]').forEach(button => {
    button.addEventListener('click', () => {
        calculator.appendNumber(button.innerText);
        calculator.updateDisplay();
        animateButton(button);
    });
});

// 运算符按钮
document.querySelectorAll('[data-action="operation"]').forEach(button => {
    button.addEventListener('click', () => {
        calculator.chooseOperation(button.dataset.value);
        calculator.updateDisplay();
        animateButton(button);
    });
});

// 等号按钮
document.querySelector('[data-action="compute"]').addEventListener('click', async () => {
    await calculator.compute();
    calculator.updateDisplay();
    animateButton(document.querySelector('[data-action="compute"]'));
});

// 清除按钮
document.querySelector('[data-action="clear"]').addEventListener('click', () => {
    calculator.clear();
    calculator.updateDisplay();
    animateButton(document.querySelector('[data-action="clear"]'));
});

// 删除按钮
document.querySelector('[data-action="delete"]').addEventListener('click', () => {
    calculator.delete();
    calculator.updateDisplay();
    animateButton(document.querySelector('[data-action="delete"]'));
});

// 清空历史按钮
document.getElementById('clear-history').addEventListener('click', () => {
    calculator.clearHistory();
});

// 按钮动画
function animateButton(button) {
    button.classList.add('key-pressed');
    setTimeout(() => {
        button.classList.remove('key-pressed');
    }, 100);
}

// 键盘支持
document.addEventListener('keydown', (e) => {
    if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
        calculator.appendNumber(e.key);
        calculator.updateDisplay();
    }
    if (e.key === '+' || e.key === '-') {
        calculator.chooseOperation(e.key);
        calculator.updateDisplay();
    }
    if (e.key === '*' || e.key === 'x' || e.key === 'X') {
        calculator.chooseOperation('×');
        calculator.updateDisplay();
    }
    if (e.key === '/') {
        e.preventDefault();
        calculator.chooseOperation('÷');
        calculator.updateDisplay();
    }
    if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculator.compute().then(() => {
            calculator.updateDisplay();
        });
    }
    if (e.key === 'Backspace') {
        calculator.delete();
        calculator.updateDisplay();
    }
    if (e.key === 'Escape') {
        calculator.clear();
        calculator.updateDisplay();
    }
});

// 页面加载完成后的欢迎提示
console.log('🧮 简易计算器已加载！');
console.log('💡 提示：你可以使用键盘进行计算');
console.log('   数字键: 0-9');
console.log('   运算符: + - * /');
console.log('   等号: Enter 或 =');
console.log('   删除: Backspace');
console.log('   清除: Escape');
console.log('   复制结果: 鼠标悬停显示屏左上角');
console.log('   使用历史: 点击历史记录可回填结果');

