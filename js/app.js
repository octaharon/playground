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
                    <div className="content-demo content-pane">
                        <GlassPane id="content-demo" bgBlurSource="#background" hasTransition={true}>
                            <Rosette id="flower-of-life" color="#FFFFFF"/>
                        </GlassPane>
                    </div>
                    <div className="controls content-pane">
                        <GlassPane id="controls" hasTransition={true} bgBlurSource="#background" scroll={true}>

                            <p>When, while the lovely valley teems with vapour around me, and the meridian sun
                                strikes
                                the upper surface of the impenetrable foliage of my trees, and but a few stray
                                gleams
                                steal into the inner sanctuary, I throw myself down among the tall grass by the
                                trickling stream; and, as I lie close to the earth, a thousand unknown plants are
                                noticed by me: when I hear the buzz of the little world among the stalks, and grow
                                familiar with the countless indescribable forms of the insects and flies, then I
                                feel
                                the presence of the Almighty, who formed us in his own image, and the breath of that
                                universal love which bears and sustains us, as it floats around us in an eternity of
                                bliss; and then, my friend, when darkness overspreads my eyes, and heaven and earth
                                seem
                                to dwell in my soul and absorb its power, like the form of a beloved mistress, then
                                I
                                often think with longing, Oh, would I could describe these conceptions, could
                                impress
                                upon paper all that is living so full and warm within me, that it might be the
                                mirror of
                                my soul, as my soul is the mirror of the infinite God!</p>

                            <p className="heading">My component</p>

                            <Slider id="slider_1" min={-20} max={60} ticks={7}>
                            </Slider>

                            <p>A wonderful serenity has taken possession of my entire soul, like these sweet
                                mornings of
                                spring which I enjoy with my whole heart. I am alone, and feel the charm of
                                existence in
                                this spot, which was created for the bliss of souls like mine. I am so happy, my
                                dear
                                friend, so absorbed in the exquisite sense of mere tranquil existence, that I
                                neglect my
                                talents. I should be incapable of drawing a single stroke at the present moment; and
                                yet
                                I feel that I never was a greater artist than now.</p>

                            <p>O my friend -- but it is too much for my strength -- I sink under the weight of the
                                splendour of these visions! A wonderful serenity has taken possession of my entire
                                soul,
                                like these sweet mornings of spring which I enjoy with my whole heart. I am alone,
                                and
                                feel the charm of existence in this spot, which was created for the bliss of souls
                                like
                                mine. I am so happy, my dear friend, so absorbed in the exquisite sense of mere
                                tranquil
                                existence, that I neglect my talents. I should be incapable of drawing a single
                                stroke
                                at the present moment; and yet I feel that I never was a greater artist than
                                now.</p>

                            <p>When, while the lovely valley teems with vapour around me, and the meridian sun
                                strikes
                                the upper surface of the impenetrable foliage of my trees, and but a few stray
                                gleams
                                steal into the inner sanctuary, I throw myself down among the tall grass by the
                                trickling stream; and, as I lie close to the earth, a thousand unknown plants are
                                noticed by me: when I hear the buzz of the little world among the stalks, and grow
                                familiar with the countless indescribable forms of the insects and flies, then I
                                feel
                                the presence of the Almighty, who formed us in his own image, and the breath of that
                                universal love which bears and sustains us, as it floats around us in an eternity of
                                bliss; and then, my friend, when darkness overspreads my eyes, and heaven and earth
                                seem
                                to dwell in my soul and absorb its power, like the form of a beloved mistress, then
                                I
                                often think with longing, Oh, would I could describe these conceptions, could
                                impress
                                upon paper all that is living so full and warm within me, that it might be the
                                mirror of
                                my soul, as my soul is the mirror of the infinite God! O my friend -- but it is too
                                much
                                for my strength -- I sink under the weight of the splendour of these visions!</p>

                            <p>A wonderful serenity has taken possession of my entire soul, like these sweet
                                mornings of
                                spring which I enjoy with my whole heart. I am alone, and feel the charm of
                                existence in
                                this spot, which was created for the bliss of souls like mine. I am so happy, my
                                dear
                                friend, so absorbed in the exquisite sense of mere tranquil existence, that I
                                neglect my
                                talents. I should be incapable of drawing a single stroke at the present moment; and
                                yet
                                I feel that I never was a greater artist than now.</p>

                            <p>When, while the lovely valley teems with vapour around me, and the meridian sun
                                strikes
                                the upper surface of the impenetrable foliage of my trees, and but a few stray
                                gleams
                                steal into the inner sanctuary, I throw myself down among the tall grass by the
                                trickling stream; and, as I lie close to the earth, a thousand unknown plants are
                                noticed by me: when I hear the buzz of the little world among the stalks, and grow
                                familiar with the countless indescribable forms of the insects and flies, then I
                                feel
                                the presence of the Almighty, who formed us in his own image, and the breath of that
                                universal love which bears and sustains us, as it floats around us in an eternity of
                                bliss; and then, my friend, when darkness overspreads my eyes, and heaven and earth
                                seem
                                to dwell in my soul and absorb its power, like the form of a beloved mistress, then
                                I
                                often think with longing, Oh, would I could describe these conceptions, could
                                impress
                                upon paper all that is living so full and warm within me, that it might be the
                                mirror of
                                my soul, as my soul is the mirror of the infinite God! O my friend -- but it is too
                                much
                                for my strength -- I sink under the weight of the splendour of these visions!</p>

                            <p>A wonderful serenity has taken possession of my entire soul, like these sweet
                                mornings of
                                spring which I enjoy with my whole heart. I am alone, and feel the charm of
                                existence in
                                this spot, which was created for the bliss of souls like mine. I am so happy, my
                                dear
                                friend, so absorbed in the exquisite sense of mere tranquil existence, that I
                                neglect my
                                talents. I should be incapable of drawing a single stroke at the present moment; and
                                yet
                                I feel that I never was a greater artist than now.</p>

                            <p>When, while the lovely valley teems with vapour around me, and the meridian sun
                                strikes
                                the upper surface of the impenetrable foliage of my trees, and but a few stray
                                gleams
                                steal into the inner sanctuary, I throw myself down among the tall grass by the
                                trickling stream; and, as I lie close to the earth, a thousand unknown plants are
                                noticed by me: when I hear the buzz of the little world among the stalks, and grow
                                familiar with the countless indescribable forms of the insects and flies, then I
                                feel
                                the presence of the Almighty, who formed us in his own image, and the breath of that
                                universal love which bears and sustains us, as it floats around us in an eternity of
                                bliss; and then, my friend, when darkness overspreads my eyes, and heaven and earth
                                seem
                                to dwell in my soul and absorb its power, like the form of a beloved mistress, then
                                I
                                often think with longing, Oh, would I could describe these conceptions, could
                                impress
                                upon paper all that is living so full and warm within me, that it might be the
                                mirror of
                                my soul, as my soul is the mirror of the infinite God! O my friend -- but it is too
                                much
                                for my strength -- I sink under the weight of the splendour of these visions! A
                                wonderful serenity has taken possession of my entire soul, like these sweet mornings
                                of
                                spring which I enjoy with my whole heart.</p>

                            <p>I am alone, and feel the charm of existence in this spot, which was created for the
                                bliss
                                of souls like mine. I am so happy, my dear friend, so absorbed in the exquisite
                                sense of
                                mere tranquil existence, that I neglect my talents. I should be incapable of drawing
                                a
                                single stroke at the present moment; and yet I feel that I never was a greater
                                artist
                                than now. When, while the lovely valley teems with vapour around me, and the
                                meridian
                                sun strikes the upper surface of the impenetrable foliage of my trees, and but a few
                                stray gleams steal into the inner sanctuary, I throw myself down among the tall
                                grass by
                                the trickling stream; and, as I lie close to the earth, a thousand unknown plants
                                are
                                noticed by me: when I hear the buzz of the little world among the stalks, and grow
                                familiar with the countless indescribable forms of the insects and flies, then I
                                feel
                                the presence of the Almighty, who formed us in his own image, and the breath of that
                                universal love which bears and sustains us, as it floats around us in an eternity of
                                bliss; and then, my friend, when darkness overspreads my eyes, and heaven and earth
                                seem
                                to dwell in my soul and absorb its power, like the form of a beloved mistress, then
                                I
                                often think with longing, Oh, would I could describe these conceptions, could
                                impress
                                upon paper all that is living so full and warm within me, that it might be the
                                mirror of
                                my soul, as my soul is the mirror of the infinite God! O my friend -- but it is too
                                much
                                for my strength -- I sink under the weight of the splendour of these visions!</p>

                            <p>A wonderful serenity has taken possession of my entire soul, like these sweet
                                mornings of
                                spring which I enjoy with my whole heart. I am alone, and feel the charm of
                                existence in
                                this spot, which was created for the bliss of souls like mine. I am so happy, my
                                dear
                                friend, so absorbed in the exquisite sense of mere tranquil existence, that I
                                neglect my
                                talents. I should be incapable of drawing a single stroke at the present moment; and
                                yet
                                I feel that I never was a greater artist than now. When, while the lovely valley
                                teems
                                with vapour around me, and the meridian sun strikes the upper surface of the
                                impenetrable foliage of my trees, and but a few stray gleams steal into the inner
                                sanctuary, I throw myself down among the tall grass by the trickling stream; and, as
                                I
                                lie close to the earth, a thousand unknown plants are noticed by me: when I hear the
                                buzz of the little world among the stalks, and grow familiar with the countless
                                indescribable forms of the insects and flies, then I feel the presence of the
                                Almighty,
                                who formed us in his own image, and the breath of that universal love which bears
                                and
                                sustains us, as it floats around us in an eternity of bliss; and then, my friend,
                                when
                                darkness overspreads my eyes, and heaven and earth seem to dwell in my soul and
                                absorb
                                its power, like the form of a beloved mistress, then I often think with longing, Oh,
                                would I could describe these conceptions, could impress upon paper all that is
                                living so
                                full and warm within me, that it might be the mirror of my soul, as my soul is the
                                mirror of the infinite God! O my friend -- but it is too much for my strength -- I
                                sink
                                under the weight of the splendour of these visions! A wonderful serenity has taken
                                possession of my entire soul, like these sweet mornings of spring which I enjoy with
                                my
                                whole heart. I am alone, and feel the charm of existence in this spot, which was
                                created
                                for the bliss of souls like mine. I am so happy, my dear friend, so absorbed in the
                                exquisite sense of mere tranquil existence, that I neglect my talents. I should be
                                incapable of drawing a single stroke at the present moment; and yet I feel that
                                I</p>

                            <p className="heading">The End</p>


                        </GlassPane>
                    </div>
                </div>
            </div>
        );
    }
}

ReactDOM.render(<App />, document.getElementById('app'));




