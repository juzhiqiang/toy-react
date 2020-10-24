/*
 * @Author: null
 * @Email: 3027704690@qq.com
 * @Date: 2020-10-22 11:33:02
 * @LastEditors: null
 * @LastEditTime: 2020-10-24 11:02:31
 * @Description: 玩具react
 * @form: (0 U 0)
 */
// 私有化
const RENDER_TO_DOM = Symbol('render to dom');

/**
 * @description: 处理自定义组件,基类
 * @param {*}
 * @return {*}
 */
export class Component {
    constructor() {
        // 创建绝对空对象
        this.props = Object.create(null);
        this.children = [];
        this._root = null;
        this._range = null;
    }

    setAttribute(name, value) {
        this.props[name] = value;
    }

    appendChild(component) {
        this.children.push(component)
    }

    get root() {
        if (!this._root) {
            this._root = this.render().root;
        }
        return this._root;
    }

    /**
     * @description: 虚拟DOM
     * @param {*}
     * @return {Object}
     */
    get vdom() {
        return this.render().vdom;
    }

    /**
     * @description: 基于range 重新绘制
     * @param {*} range
     * @return {*}
     */
    [RENDER_TO_DOM](range) {
        this._range = range;
        this._vdom = this.vdom;
        this._vdom[RENDER_TO_DOM](range);
    }

    update() {

        // 节点对比
        let isSameNode = (oldNode, newNode) => {
            // 直接对比跟节点
            if (oldNode.type !== newNode.type) return false;
            for (const name in newNode.props) {
                // 属性不同认为不同
                if (newNode.props[name] !== oldNode.props[name]) {
                    return false;
                }
            }
            // 属性数量不同认为不同
            if (Object.keys(oldNode.props).length > Object.keys(newNode.props).length) {
                return false;
            }

            // 内容不同
            if (newNode.type === '#text') {
                if (newNode.content !== oldNode.content) return false;
            }

            return true;
        };

        let update = (oldNode, newNode) => {
            /*
                type 对比
                props 对比
                children
                #text content 【可用dpath】对比
            */

            if (!isSameNode(oldNode, newNode)) {
                newNode[RENDER_TO_DOM](oldNode._range)
                return;
            }

            newNode._reange = oldNode._range;

            // 处理子节点
            let newChildren = newNode.vchildren;
            let oldChildren = oldNode.vchildren;

            if(!newChildren || !newChildren.length) return;
            let tailRange = oldChildren[oldChildren.length - 1]._range;

            for (let i = 0; i < newChildren.length; i++) {
                let newChild = newChildren[i];
                let oldChild = oldChildren[i]
                if (i < oldChildren.length) {
                    update(oldChild, newChild);
                } else {
                    let range = document.createRange()
                    range.setStart(tailRange.endContainer,tailRange.endOffset);
                    range.setEnd(tailRange.endContainer,tailRange.endOffset);
                    newChild[RENDER_TO_DOM](range);
                    tailRange = range;
                }
            }
        }

        let vdom = this.vdom;
        update(this._vdom, vdom);
        this._vdom = vdom;
    }

    // 重新绘制
    // rerender() {
    //     let oldRange = this._range;
    //     // 创建新的range
    //     let range = document.createRange();
    //     range.setStart(oldRange.startContainer, oldRange.startOffset)
    //     range.setEnd(oldRange.startContainer, oldRange.startOffset)
    //     // range全空有bug
    //     // 新的插入老range 后
    //     this[RENDER_TO_DOM](range);

    //     // 清除老的
    //     oldRange.setStart(range.endContainer, range.endOffset);
    //     oldRange.deleteContents();
    // }

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
        this.update();
    }
}

/**
 * @description: 
 * @param {*}
 * @return {*}
 */
class ElementWrapper extends Component {
    constructor(type) {
        super(type);
        this.type = type;
    }

    /**
     * @description: 虚拟DOM
     * @param {*}
     * @return {Object}
     */
    get vdom() {
        this.vchildren = this.children.map(child => child.vdom);
        return this;
    }

    // 生命周期
    [RENDER_TO_DOM](range) {
        this._range = range;

        let root = document.createElement(this.type);
        for (const name in this.props) {
            let value = this.props[name];
            // on 开头属性做特殊处理
            if (name.match(/^on([\s\S]+)$/)) {
                root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
            } else {
                if (name === 'className') {
                    root.setAttribute("class", value);
                } else {
                    root.setAttribute(name, value);
                };
            }
        }

        // 确保一定存在
        if (!this.vchildren) this.vchildren.map(child => child.vdom);

        for (const child of this.vchildren) {
            let childRange = document.createRange();
            childRange.setStart(root, root.childNodes.length);
            childRange.setEnd(root, root.childNodes.length);
            child[RENDER_TO_DOM](childRange);
        }
        replaceContent(range, root);
    }

}


/**
 * @description: 
 * @param {*}
 * @return {*}
 */
class TextWrapper extends Component {
    constructor(content) {
        super(content);
        this.content = content;
        this.type = "#text";
    }

    /**
     * @description: 虚拟DOM
     * @param {*}
     * @return {Object}
     */
    get vdom() {
        return this;
    }

    [RENDER_TO_DOM](range) {
        let root = document.createTextNode(this.content);
        this._range = range;
        replaceContent(range, root);
    }

}


function replaceContent(range, node) {
    range.insertNode(node);
    range.setStartAfter(node);
    range.deleteContents();

    range.setStartBefore(node);
    range.setEndAfter(node);
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