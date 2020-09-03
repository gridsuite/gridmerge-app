/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {ComposableMap, Geographies, Geography, ZoomableGroup} from "react-simple-maps";

import {makeStyles} from '@material-ui/core/styles';
import bbox from 'geojson-bbox';

const COUNTRY_FILL_COLOR = '#78899a';
const COUNTRY_STROKE_COLOR = 'white';
const DEFAULT_CENTER = [0, 0];

const useStyles = makeStyles((theme) => ({
    map: {
        backgroundColor: theme.palette.background.paper
    },
    country: {
        fill: COUNTRY_FILL_COLOR,
        stroke: COUNTRY_STROKE_COLOR,
        strokeWidth: '1px',
        vectorEffect: 'non-scaling-stroke'
    }
}));

const MergeMap = (props) => {

    const [geographies, setGeographies] = useState([]);
    const [center, setCenter] = useState(DEFAULT_CENTER);

    const classes = useStyles();

    function computeCenter(geoJsons) {
        // compute geometries bounding box
        const reducer = (oldBb, json) =>  {
            const newBb = bbox(json);
            if (oldBb) {
                return [Math.min(oldBb[0], newBb[0]),
                    Math.min(oldBb[1], newBb[1]),
                    Math.max(oldBb[2], newBb[2]),
                    Math.max(oldBb[3], newBb[3])];
            }
            return newBb;
        }
        const bb = geoJsons.reduce(reducer, null);

        // compute geometries center
        return [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2];
    }

    useEffect(() => {
        if (props.countries.length > 0) {
            Promise.all(props.countries.map(country => {
                    const url = country + '.json';
                    return fetch(url).then(resp => resp.json())
                }
            )).then(jsons => {
                setCenter(computeCenter(jsons));
                setGeographies(jsons);
            })
        } else {
            setCenter(DEFAULT_CENTER);
            setGeographies([]);
        }
    }, [props.countries]);

    return (
        <div className={classes.map}>
            <ComposableMap style={{position:'absolute', top:'0', left:'0', height:'100%', width:'100%', zIndex:'-1'}}
                           projectionConfig={{ scale: 1800}}>
                <ZoomableGroup center={center} minZoom={1} maxZoom={1}>
                    <Geographies geography={geographies}>
                        {({geographies}) =>
                            geographies.map(geo => {
                                return <Geography key={geo.rsmKey} geography={geo} className={classes.country}/>
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
        </div>
  )
}
MergeMap.defaultProps = {
    countries: [],
};

MergeMap.propTypes = {
    countries: PropTypes.array
}

export default MergeMap;
