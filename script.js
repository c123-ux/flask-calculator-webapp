class Calculator {
    constructor(previousOperandElement, currentOperandElement) {
        this.previousOperandElement = previousOperandElement;
        this.currentOperandElement = currentOperandElement;
        this.clear();
    }

    // 重置所有状态
    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.shouldResetScreen = false;
    }

    // 删除最后一位
    delete() {
        if (this.shouldResetScreen) return;
        if (this.currentOperand === '0') return;
        if (this.currentOperand.length === 1) {
            this.currentOperand = '0';
        } else {
            this.currentOperand = this.currentOperand.slice(0, -1);
        }
    }

    // 添加数字
    appendNumber(number) {
        // 如果刚计算完，先重置屏幕
        if (this.shouldResetScreen) {
            this.currentOperand = '';
            this.shouldResetScreen = false;
        }
        
        // 防止多个小数点
        if (number === '.' && this.currentOperand.includes('.')) return;
        
        // 替换初始的 0
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number.toString();
        } else {
            this.currentOperand = this.currentOperand.toString() + number.toString();
        }
    }

    // 选择运算符
    chooseOperation(operation) {
        if (this.currentOperand === '') return;
        
        // 如果已经有前一个操作数，先计算
        if (this.previousOperand !== '') {
            this.compute();
        }
        
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '';
    }

    // 执行计算
    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        
        if (isNaN(prev) || isNaN(current)) return;
        
        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '-':
                computation = prev - current;
                break;
            case '×':
                computation = prev * current;
                break;
            case '÷':
                if (current === 0) {
                    alert('不能除以零！');
                    this.clear();
                    return;
                }
                computation = prev / current;
                break;
            default:
                return;
        }
        
        // 处理精度问题（如 0.1 + 0.2）
        this.currentOperand = Math.round(computation * 100000000) / 100000000;
        this.operation = undefined;
        this.previousOperand = '';
        this.shouldResetScreen = true;
    }

    // 切换正负号
    toggleSign() {
        if (this.currentOperand === '0') return;
        this.currentOperand = (parseFloat(this.currentOperand) * -1).toString();
    }

    // 格式化数字显示（添加千分位）
    getDisplayNumber(number) {
        const stringNumber = number.toString();
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

    // 更新界面
    updateDisplay() {
        this.currentOperandElement.innerText = this.getDisplayNumber(this.currentOperand);
        
        // 如果数字过长，缩小字体
        if (this.currentOperand.toString().length > 10) {
            this.currentOperandElement.classList.add('long-number');
        } else {
            this.currentOperandElement.classList.remove('long-number');
        }
        
        if (this.operation != null) {
            this.previousOperandElement.innerText = 
                `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            this.previousOperandElement.innerText = '';
        }
    }
}

// ==================== 初始化 ====================

const previousOperandElement = document.querySelector('.previous-operand');
const currentOperandElement = document.querySelector('.current-operand');
const calculator = new Calculator(previousOperandElement, currentOperandElement);

// 数字按钮事件监听
document.querySelectorAll('[data-number]').forEach(button => {
    button.addEventListener('click', () => {
        calculator.appendNumber(button.innerText);
        calculator.updateDisplay();
        
        // 添加按键动画
        animateButton(button);
    });
});

// 运算符按钮事件监听
document.querySelectorAll('[data-action="operation"]').forEach(button => {
    button.addEventListener('click', () => {
        calculator.chooseOperation(button.dataset.value);
        calculator.updateDisplay();
        
        // 添加按键动画
        animateButton(button);
    });
});

// 等号按钮
document.querySelector('[data-action="compute"]').addEventListener('click', () => {
    calculator.compute();
    calculator.updateDisplay();
    
    // 添加按键动画
    animateButton(document.querySelector('[data-action="compute"]'));
});

// 清除按钮
document.querySelector('[data-action="clear"]').addEventListener('click', () => {
    calculator.clear();
    calculator.updateDisplay();
    
    // 添加按键动画
    animateButton(document.querySelector('[data-action="clear"]'));
});

// 删除按钮
document.querySelector('[data-action="delete"]').addEventListener('click', () => {
    calculator.delete();
    calculator.updateDisplay();
    
    // 添加按键动画
    animateButton(document.querySelector('[data-action="delete"]'));
});

// 按钮动画函数
function animateButton(button) {
    button.classList.add('key-pressed');
    setTimeout(() => {
        button.classList.remove('key-pressed');
    }, 100);
}

// 键盘支持
document.addEventListener('keydown', (e) => {
    let keyHandled = false;
    
    // 数字键和小数点
    if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
        calculator.appendNumber(e.key);
        keyHandled = true;
        highlightKey(e.key);
    }
    
    // 加法
    if (e.key === '+') {
        calculator.chooseOperation('+');
        keyHandled = true;
        highlightOperator('+');
    }
    
    // 减法
    if (e.key === '-') {
        calculator.chooseOperation('-');
        keyHandled = true;
        highlightOperator('-');
    }
    
    // 乘法
    if (e.key === '*' || e.key === 'x' || e.key === 'X') {
        calculator.chooseOperation('×');
        keyHandled = true;
        highlightOperator('×');
    }
    
    // 除法
    if (e.key === '/') {
        e.preventDefault();
        calculator.chooseOperation('÷');
        keyHandled = true;
        highlightOperator('÷');
    }
    
    // 等号或回车
    if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculator.compute();
        keyHandled = true;
        highlightEquals();
    }
    
    // 退格键
    if (e.key === 'Backspace') {
        calculator.delete();
        keyHandled = true;
        highlightAction('delete');
    }
    
    // ESC 键清除
    if (e.key === 'Escape') {
        calculator.clear();
        keyHandled = true;
        highlightAction('clear');
    }
    
    if (keyHandled) {
        calculator.updateDisplay();
    }
});

// 高亮对应的屏幕按键
function highlightKey(key) {
    const buttons = document.querySelectorAll('[data-number]');
    buttons.forEach(button => {
        if (button.innerText === key) {
            animateButton(button);
        }
    });
}

function highlightOperator(op) {
    const buttons = document.querySelectorAll('[data-action="operation"]');
    buttons.forEach(button => {
        if (button.dataset.value === op) {
            animateButton(button);
        }
    });
}

function highlightEquals() {
    animateButton(document.querySelector('[data-action="compute"]'));
}

function highlightAction(action) {
    animateButton(document.querySelector(`[data-action="${action}"]`));
}

// 页面加载完成后的欢迎提示
console.log('🧮 简易计算器已加载！');
console.log('💡 提示：你可以使用键盘进行计算');
console.log('   数字键: 0-9');
console.log('   运算符: + - * /');
console.log('   等号: Enter 或 =');
console.log('   删除: Backspace');
console.log('   清除: Escape');

