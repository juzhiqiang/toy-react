/*
 * @Author: null
 * @Email: 3027704690@qq.com
 * @Date: 2020-10-22 11:33:02
 * @LastEditors: null
 * @LastEditTime: 2020-10-22 11:56:38
 * @Description: 玩具react
 * @form: (0 U 0)
 */

class ElementWrapper {
    constructor(type) {
        this.root = document.createElement(type);
    }

    setAttribute(name, value) {
        this.root.setAttribute(name, value);
    }

    appendChild(component) {
        this.root.appendChild(component.root);
    }
}

class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content);
    }
}


export class Component {
    constructor(content) {
        // 创建绝对空对象
        this.props = Object.create(null);
        this.children = [];
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
}


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

export function render(component, parentElement) {
    parentElement.appendChild(component.root);
}