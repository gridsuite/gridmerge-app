/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

import { makeStyles } from '@material-ui/core/styles';

const countries = ['fr', 'be', 'es', 'pt'];

const COUNTRY_FILL_COLOR = '#78899a';
const COUNTRY_STROKE_COLOR = 'white';

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

const MergeMap = () => {

    const [geographies, setGeographies] = useState([]);

    const classes = useStyles();

    useEffect(() => {
        Promise.all(countries.map(country => {
            const url = country + '.json';
            return fetch(url).then(resp => resp.json())
        }
        )).then(jsons => {
            setGeographies(jsons);
        })
    }, [countries]);

    return (
        <div className={classes.map}>
            <ComposableMap projectionConfig={{
                scale: 1000
            }}>
                <ZoomableGroup center={[1, 48]}>
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

export default MergeMap;
