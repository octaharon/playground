require('../sass/app.scss');

import 'font-awesome/scss/font-awesome.scss';
import React from 'react';
import ReactDOM from 'react-dom';
import Cookies from 'universal-cookie';
import ReactSpinner from 'react-spinjs';
import d3 from './d3-lib';

import Delay from 'react-delay';

import MoireRoom from './components/MoireRoom/MoireRoom';
import Rosette from './components/Rosette/Rosette';
import Slider from './components/Slider/Slider';


const loadDelay = 2000;

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true
        }
    }

    componentDidMount() {
        this.setState({loading: false});
        d3.select('body').transition()
          .delay(250)
          .duration(loadDelay)
          .style('background-color', '#000');
    }


    render() {
        return (
            <div className="wrapper">
                <div id="modal-backdrop" style={this.state.loading ? {} : {display: 'none'}}>
                    <ReactSpinner />
                </div>
                {/*<MoireRoom delay={loadDelay}/>*/}
                <div className="content-demo">
                    <Rosette id="flower-of-life" color="#FFFF00"/>
                </div>
                <div className="controls">
                    <Slider id="slider_1" min={-20} max={60} ticks={7}>
                    </Slider>
                </div>
            </div>
        );
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('app'));




