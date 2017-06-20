require('../sass/app.scss');


import 'font-awesome/scss/font-awesome.scss';
import React from 'react';
import ReactDOM from 'react-dom';
import Cookies from 'universal-cookie';
import ReactSpinner from 'react-spinjs';
import d3 from './d3-lib';

import MoireRoom from './components/MoireRoom/MoireRoom';
import Rosette from './components/Rosette/Rosette';
import Slider from './components/Slider/Slider';
import GlassPane from './components/GlassPane/GlassPane';

import ComponentDemo from './components/ComponentDemo/ComponentDemo';

const loadDelay = 200;

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true
        }
    }

    componentDidMount() {
        this.setState({loading: false}, function () {
            d3.select('body').transition()
              .delay(250)
              .duration(loadDelay)
              .style('background-color', '#000')
              .on('end', function () {
                  d3.select('#background')
                    .transition()
                    .duration(loadDelay)
                    .ease(d3.easeSin)
                    .style('opacity', 1)
                    .on('end', function () {
                        d3.selectAll('.content-pane').classed('fade-in', true);
                    });
              });
        });
    }


    render() {
        return (
            <div className="wrapper">
                <div id="modal-backdrop" style={this.state.loading ? {} : {display: 'none'}}>
                    <ReactSpinner />
                </div>
                <div id="background" style={{opacity: 0}}>
                    <div className="background-img"></div>
                    {/*<MoireRoom delay={loadDelay}/>*/}
                </div>
                <div id="content">
                    <ComponentDemo component="Slider">
                        <div className="slider-description" key="slider-description">
                            <p>Some text goes here</p>
                        </div>
                    </ComponentDemo>
                </div>
            </div>
        );
    }
}

ReactDOM.render(<App />, document.getElementById('app'));




