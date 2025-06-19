/**
 * JSON格式化工具
 * 提供JSON格式化、压缩、转义、去除转义等功能
 */

const { EditorState } = require('@codemirror/state');
const { EditorView, keymap } = require('@codemirror/view');
const { defaultKeymap, indentWithTab } = require('@codemirror/commands');
const { json } = require('@codemirror/lang-json');
const { lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine, keymap: keymapOf } = require('@codemirror/view');
const { foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldKeymap } = require('@codemirror/language');
const { closeBrackets, closeBracketsKeymap } = require('@codemirror/autocomplete');
const { searchKeymap } = require('@codemirror/search');
const { history, historyKeymap } = require('@codemirror/commands');
const { lintKeymap } = require('@codemirror/lint');

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
            editorContainer: document.querySelector('.editor-container'),
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
        // 创建基本扩展
        const extensions = [
            lineNumbers(),
            highlightActiveLineGutter(),
            highlightSpecialChars(),
            history(),
            foldGutter(),
            drawSelection(),
            dropCursor(),
            EditorState.allowMultipleSelections.of(true),
            indentOnInput(),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            bracketMatching(),
            closeBrackets(),
            rectangularSelection(),
            crosshairCursor(),
            highlightActiveLine(),
            json(),
            EditorView.lineWrapping,
            keymap.of([
                ...closeBracketsKeymap,
                ...defaultKeymap,
                ...searchKeymap,
                ...historyKeymap,
                ...foldKeymap,
                ...lintKeymap,
                indentWithTab
            ]),
            EditorState.tabSize.of(2),
            EditorView.theme({
                '&': {
                    height: '500px'
                },
                '.cm-scroller': {
                    height: '500px !important'
                }
            })
        ];

        // 创建编辑器状态
        const state = EditorState.create({
            doc: '',
            extensions
        });

        // 创建编辑器视图
        this.editor = new EditorView({
            state,
            parent: this.elements.editor
        });

        // 处理编辑器容器的点击事件
        this.elements.editorContainer.addEventListener('click', (e) => {
            // 如果点击的是编辑器容器但不是编辑器本身
            if (e.target === this.elements.editorContainer) {
                this.editor.focus();
            }
        });
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
            switch (event.key) {
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
     * 获取编辑器内容
     * @returns {string} 编辑器内容
     */
    getEditorValue() {
        return this.editor.state.doc.toString();
    }

    /**
     * 设置编辑器内容
     * @param {string} value 要设置的内容
     */
    setEditorValue(value) {
        const transaction = this.editor.state.update({
            changes: {
                from: 0,
                to: this.editor.state.doc.length,
                insert: value
            }
        });
        this.editor.dispatch(transaction);
    }

    /**
     * 格式化JSON
     */
    formatJSON() {
        try {
            const input = this.getEditorValue().trim();
            if (!input) {
                this.showMessage('请输入JSON字符串', 'warning');
                return;
            }

            const parsed = JSON.parse(input);
            const formatted = JSON.stringify(parsed, null, 2);
            this.setEditorValue(formatted);
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
            const input = this.getEditorValue().trim();
            if (!input) {
                this.showMessage('请输入JSON字符串', 'warning');
                return;
            }

            const parsed = JSON.parse(input);
            const compressed = JSON.stringify(parsed);
            this.setEditorValue(compressed);
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
            const input = this.getEditorValue().trim();
            if (!input) {
                this.showMessage('请输入JSON字符串', 'warning');
                return;
            }

            const escaped = JSON.stringify(input);
            this.setEditorValue(escaped);
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
            const input = this.getEditorValue().trim();
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

            this.setEditorValue(content);
            this.showMessage('去除转义成功', 'success');
        } catch (error) {
            this.showMessage(`去除转义失败: ${error.message}`, 'error');
        }
    }

    /**
     * 清空输入
     */
    clearInput() {
        this.setEditorValue('');
        this.showMessage('内容已清空', 'success');
    }

    /**
     * 复制到剪贴板
     */
    async copyToClipboard() {
        try {
            const content = this.getEditorValue();
            await navigator.clipboard.writeText(content);
            this.showMessage('已复制到剪贴板', 'success');
        } catch (error) {
            this.showMessage('复制失败', 'error');
        }
    }

    /**
     * 从剪贴板粘贴
     */
    async pasteFromClipboard() {
        try {
            const content = await navigator.clipboard.readText();
            this.setEditorValue(content);
            this.showMessage('已从剪贴板粘贴', 'success');
        } catch (error) {
            this.showMessage('粘贴失败', 'error');
        }
    }
}

// 创建实例
window.addEventListener('DOMContentLoaded', () => {
    const formatter = new JSONFormatter();
    // 设置初始焦点
    setTimeout(() => formatter.editor.focus(), 100);
}); 