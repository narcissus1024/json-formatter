/**
 * JSON格式化工具
 * 提供JSON格式化、压缩、转义、去除转义等功能
 */
class JSONFormatter {
    /**
     * 初始化JSON格式化工具
     */
    constructor() {
        this.initializeElements();
        this.initializeEditor();
        this.bindEvents();
    }

    /**
     * 初始化DOM元素
     */
    initializeElements() {
        this.elements = {
            editor: document.getElementById('inputEditor'),
            formatBtn: document.getElementById('formatBtn'),
            compressBtn: document.getElementById('compressBtn'),
            escapeBtn: document.getElementById('escapeBtn'),
            unescapeBtn: document.getElementById('unescapeBtn'),
            clearBtn: document.getElementById('clearBtn'),
            copyBtn: document.getElementById('copyBtn'),
            pasteBtn: document.getElementById('pasteBtn'),
            errorText: document.getElementById('errorText')
        };
    }

    /**
     * 初始化CodeMirror编辑器
     */
    initializeEditor() {
        this.editor = CodeMirror.fromTextArea(this.elements.editor, {
            mode: { name: 'javascript', json: true },
            theme: 'eclipse',
            lineNumbers: true,
            lineWrapping: true,
            indentUnit: 2,
            tabSize: 2,
            autoCloseBrackets: true,
            matchBrackets: true,
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"],
            scrollbarStyle: 'native',
            viewportMargin: Infinity,
            fixedGutter: true,
            lint: { json: true },
            extraKeys: {
                "Ctrl-Q": (cm) => cm.foldCode(cm.getCursor())
            },
            placeholder: "请输入JSON字符串...",
            styleActiveLine: true,
            foldOptions: {
                widget: '...'
            }
        });

        // 设置编辑器样式
        this.editor.setSize('100%', '500px');
        
        // 设置编辑器容器样式
        const wrapper = this.editor.getWrapperElement();
        wrapper.style.minHeight = '500px';
        wrapper.style.height = '500px';
        
        // 设置滚动容器样式
        const scroller = this.editor.getScrollerElement();
        scroller.style.minHeight = '500px';
        scroller.style.height = '500px';
        
        // 刷新编辑器以确保正确显示
        setTimeout(() => this.editor.refresh(), 100);
    }

    /**
     * 绑定事件处理
     */
    bindEvents() {
        // 监听来自主进程的聚焦消息
        const { ipcRenderer } = require('electron');
        ipcRenderer.on('focus-editor', () => {
            this.editor.focus();
        });

        // 绑定按钮事件
        this.elements.formatBtn.addEventListener('click', () => this.formatJSON());
        this.elements.compressBtn.addEventListener('click', () => this.compressJSON());
        this.elements.escapeBtn.addEventListener('click', () => this.escapeJSON());
        this.elements.unescapeBtn.addEventListener('click', () => this.unescapeJSON());
        this.elements.clearBtn.addEventListener('click', () => this.clearInput());
        this.elements.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.elements.pasteBtn.addEventListener('click', () => this.pasteFromClipboard());

        // 绑定快捷键
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    /**
     * 处理键盘快捷键
     * @param {KeyboardEvent} event 键盘事件
     */
    handleKeydown(event) {
        if (event.ctrlKey || event.metaKey) {
            switch(event.key) {
                case 'f':
                    event.preventDefault();
                    this.formatJSON();
                    break;
                case 'm':
                    event.preventDefault();
                    this.compressJSON();
                    break;
                case 'e':
                    event.preventDefault();
                    this.escapeJSON();
                    break;
                case 'u':
                    event.preventDefault();
                    this.unescapeJSON();
                    break;
                case 'l':
                    event.preventDefault();
                    this.clearInput();
                    break;
            }
        }
    }

    /**
     * 显示操作消息
     * @param {string} message 消息内容
     * @param {string} type 消息类型
     */
    showMessage(message, type) {
        this.elements.errorText.textContent = message;
        this.elements.errorText.className = type;
    }

    /**
     * 格式化JSON
     */
    formatJSON() {
        try {
            const input = this.editor.getValue().trim();
            if (!input) {
                this.showMessage('请输入JSON字符串', 'warning');
                return;
            }

            const parsed = JSON.parse(input);
            const formatted = JSON.stringify(parsed, null, 2);
            this.editor.setValue(formatted);
            this.showMessage('JSON格式化成功', 'success');
        } catch (error) {
            this.showMessage(`格式化失败: ${error.message}`, 'error');
        }
    }

    /**
     * 压缩JSON
     */
    compressJSON() {
        try {
            const input = this.editor.getValue().trim();
            if (!input) {
                this.showMessage('请输入JSON字符串', 'warning');
                return;
            }

            const parsed = JSON.parse(input);
            const compressed = JSON.stringify(parsed);
            this.editor.setValue(compressed);
            this.showMessage('JSON压缩成功', 'success');
        } catch (error) {
            this.showMessage(`压缩失败: ${error.message}`, 'error');
        }
    }

    /**
     * 转义JSON字符串
     */
    escapeJSON() {
        try {
            const input = this.editor.getValue().trim();
            if (!input) {
                this.showMessage('请输入JSON字符串', 'warning');
                return;
            }

            const escaped = JSON.stringify(input);
            this.editor.setValue(escaped);
            this.showMessage('JSON转义成功', 'success');
        } catch (error) {
            this.showMessage(`转义失败: ${error.message}`, 'error');
        }
    }

    /**
     * 去除JSON字符串的转义
     */
    unescapeJSON() {
        try {
            const input = this.editor.getValue().trim();
            if (!input) {
                this.showMessage('请输入JSON字符串', 'warning');
                return;
            }

            // 去除字符串两端的引号（如果有）
            let content = input;
            if (content.startsWith('"') && content.endsWith('"')) {
                content = content.slice(1, -1);
            }

            // 使用JSON.parse处理转义字符
            try {
                content = JSON.parse(`"${content}"`);
            } catch (e) {
                // 如果解析失败，尝试直接替换常见的转义字符
                content = content
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\')
                    .replace(/\\n/g, '\n')
                    .replace(/\\r/g, '\r')
                    .replace(/\\t/g, '\t')
                    .replace(/\\b/g, '\b')
                    .replace(/\\f/g, '\f');
            }

            this.editor.setValue(content);
            this.showMessage('去除转义成功', 'success');
        } catch (error) {
            this.showMessage(`去除转义失败: ${error.message}`, 'error');
        }
    }

    /**
     * 清空输入
     */
    clearInput() {
        this.editor.setValue('');
        this.showMessage('内容已清空', 'success');
    }

    /**
     * 复制到剪贴板
     */
    async copyToClipboard() {
        try {
            const text = this.editor.getValue();
            if (!text) {
                this.showMessage('没有内容可复制', 'warning');
                return;
            }

            await navigator.clipboard.writeText(text);
            this.showMessage('复制成功', 'success');
        } catch (error) {
            this.showMessage('复制失败，请手动复制', 'error');
        }
    }

    /**
     * 从剪贴板粘贴
     */
    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            this.editor.setValue(text);
            this.showMessage('粘贴成功', 'success');
        } catch (error) {
            this.showMessage('粘贴失败，请手动粘贴', 'error');
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new JSONFormatter();
}); 