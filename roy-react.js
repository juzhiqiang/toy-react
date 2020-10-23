/*
 * @Author: null
 * @Email: 3027704690@qq.com
 * @Date: 2020-10-22 11:33:02
 * @LastEditors: null
 * @LastEditTime: 2020-10-23 15:08:29
 * @Description: 玩具react
 * @form: (0 U 0)
 */
// 私有化
const RENDER_TO_DOM = Symbol('render to dom');

/**
 * @description: 
 * @param {*}
 * @return {*}
 */
class ElementWrapper {
    constructor(type) {
        this.root = document.createElement(type);
    }

    setAttribute(name, value) {
        // on 开头属性做特殊处理
        if (name.match(/^on([\s\S]+)$/)) {
            this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
        } else {
            if (name === 'className') {
                this.root.setAttribute("class", value);
            } else {
                this.root.setAttribute(name, value);
            };
        }
    }

    // 生命周期
    [RENDER_TO_DOM](range) {
        range.deleteContents();
        range.insertNode(this.root);
    }

    appendChild(component) {
        let range = document.createRange();
        range.setStart(this.root, this.root.childNodes.length);
        range.setEnd(this.root, this.root.childNodes.length);
        component[RENDER_TO_DOM](range);
    }
}

/**
 * @description: 
 * @param {*}
 * @return {*}
 */
class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content);
    }

    [RENDER_TO_DOM](range) {
        range.deleteContents();
        range.insertNode(this.root);
    }

}


/**
 * @description: 处理自定义组件
 * @param {*}
 * @return {*}
 */
export class Component {
    constructor(content) {
        // 创建绝对空对象
        this.props = Object.create(null);
        this.children = [];
        this._range = null;
    }

    setAttribute(name, value) {
        this.props[name] = value;
    }

    appendChild(component) {
        this.children.push(component)
    }

    /**
     * @description: 基于range 重新绘制
     * @param {*} range
     * @return {*}
     */
    [RENDER_TO_DOM](range) {
        this._range = range;
        this.render()[RENDER_TO_DOM](range);
    }

    get root() {
        if (!this._root) {
            this._root = this.render().root;
        }
        return this._root;
    }

    // 重新绘制
    rerender() {
        let oldRange = this._range;
        // 创建新的range
        let range = document.createRange();
        range.setStart(oldRange.startContainer, oldRange.startOffset)
        range.setEnd(oldRange.startContainer, oldRange.startOffset)
        // range全空有bug
        // 新的插入老range 后
        this[RENDER_TO_DOM](range);

        // 清除老的
        oldRange.setStart(range.endContainer,range.endOffset);
        oldRange.deleteContents();
    }

    /**
     * @description: 数据对比
     * @param {*}
     * @return {*}
     */
    setState(newState) {
        // 
        if (this.state === null || typeof this.state !== 'object') {
            this.state = newState;
            // 重绘
            this.rerender();
            return;
        }

        // 深拷贝
        let merge = (oldState, newState) => {
            for (const p in newState) {
                if (oldState[p] === null || typeof oldState[p] !== "object") {
                    oldState[p] = newState[p];
                } else {
                    merge(oldState[p], newState[p]);
                }
            }
        }

        merge(this.state, newState);
        this.rerender();
    }
}


/**
 * @description: 创建节点
 * @param {*} type
 * @param {*} attributes
 * @param {array} children
 * @return {*}
 */
export function createElement(type, attributes, ...children) {
    let e;
    if (typeof type === 'string') {
        e = new ElementWrapper(type);
    } else {
        e = new type;
    }

    // 设置属性
    for (const p in attributes) {
        e.setAttribute(p, attributes[p]);
    }

    // 处理子节点
    let insertChild = (children) => {
        for (let child of children) {
            // 字符串当文本
            if (typeof child === 'string') {
                child = new TextWrapper(child)
            };

            if (child === null) continue;

            if (typeof child === "object" && child instanceof Array) {
                insertChild(child);
            } else {
                e.appendChild(child);
            }
        }
    }
    insertChild(children);


    return e;
}

/**
 * @description: render 将视图注入到页面
 * @param {String} component 组件
 * @param {Element} parentElement 父元素
 * @return {*}
 */
export function render(component, parentElement) {
    let range = document.createRange();
    range.setStart(parentElement, 0);
    range.setEnd(parentElement, parentElement.childNodes.length);
    range.deleteContents();
    component[RENDER_TO_DOM](range);
}