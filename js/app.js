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
import GlassPane from './components/GlassPane/GlassPane';

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
                    <GlassPane id="content-demo">
                        <Rosette id="flower-of-life" color="#FFFFFF"/>
                    </GlassPane>
                </div>
                <div className="controls">
                    <GlassPane id="controls">
                        <Slider id="slider_1" min={-20} max={60} ticks={7}>
                        </Slider>
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Potenti gravida pretium: Odio
                            adipiscing fermentum? Ornare sem aliquam bibendum, nullam pellentesque mauris... Habitasse
                            eget turpis erat magna, faucibus potenti massa ante ipsum aptent augue? Sem elit iaculis
                            consectetuer quam a: Ante penatibus ligula quis hymenaeos! Pharetra leo lectus... Sagittis
                            taciti facilisi purus netus. Faucibus posuere cras mattis iaculis hymenaeos. Blandit ut
                            sapien consequat nam primis neque;
                        </p>
                        <p>
                            Nisi egestas netus facilisis elementum: Fames
                            sapien
                            sodales odio orci diam eu mauris? Hac hac hymenaeos! Elit tincidunt placerat tincidunt ad
                            nisi pulvinar, id ultricies nam malesuada volutpat; Curae; cras est. Ipsum sociis elit
                            interdum vitae sem libero duis: Diam fringilla fames lacus hymenaeos, gravida diam dignissim
                            pede... Aenean erat sollicitudin... Senectus et auctor ad eu conubia erat cras? Tincidunt
                            cras augue mauris tincidunt metus? Ac pede ullamcorper;
                        </p>
                        <p>
                            Habitasse eu condimentum:
                            Orci purus at, vitae senectus torquent hac! Interdum non laoreet pede integer felis
                            malesuada...
                            Justo nonummy aliquet hendrerit vel nisi! Nullam conubia pharetra fames inceptos sapien
                            dapibus:
                            Conubia ligula eget nam nostra nostra; Molestie a ligula consequat! Sodales non ultrices
                            cubilia
                            lorem malesuada nam, sociis lorem et fermentum adipiscing tempus aptent... Nunc in pede
                            tellus!
                            Sociosqu vel vehicula feugiat pretium... Arcu suscipit augue tellus conubia libero metus
                            massa... Nisl consectetuer arcu suscipit primis hac mus porttitor. Sociis elit accumsan
                            nonummy
                            aptent eu. Ultricies sodales nascetur... Per nullam torquent netus blandit aliquam mi
                            pede...
                            Accumsan sit lobortis vulputate eu sollicitudin aptent rhoncus... Per luctus hendrerit
                            habitant
                            mus bibendum velit euismod? Arcu aliquam leo fermentum faucibus auctor magnis mi;
                        </p>
                    </GlassPane>
                </div>
            </div>
        );
    }
}

ReactDOM.render(
    <App />
    ,
    document.getElementById('app'));




