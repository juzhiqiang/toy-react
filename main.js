import {
    createElement,
    Component,
    render
} from './roy-react.js';

class MyComponents extends Component {
    render() {
        return <div>
            <h1>my component</h1>
            {this.children}
        </div>;
    }
}

render(<MyComponents id="test" class="test__react">
    <span>test</span>
    <div>toy react</div>
</MyComponents>,document.body);