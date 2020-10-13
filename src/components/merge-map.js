/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
    ComposableMap,
    Geographies,
    Geography,
    ZoomableGroup,
} from 'react-simple-maps';

import { makeStyles } from '@material-ui/core/styles';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import bbox from 'geojson-bbox';
import { IgmStatus, getIgmStatus, MergeType } from '../utils/api';

const TSO_STROKE_COLOR = 'white';
const DEFAULT_CENTER = [0, 0];
const DEFAULT_SCALE = 30000;

const useStyles = makeStyles((theme) => ({
    tso: {
        stroke: TSO_STROKE_COLOR,
        strokeWidth: '1px',
        vectorEffect: 'non-scaling-stroke',
    },
}));

const MergeMap = (props) => {
    const [data, setData] = useState({
        geographies: [],
        center: DEFAULT_CENTER,
        scale: DEFAULT_SCALE,
    });

    const classes = useStyles();

    function computeBoundingBox(geoJsons) {
        const reducer = (oldBb, json) => {
            const newBb = bbox(json);
            if (oldBb) {
                return [
                    Math.min(oldBb[0], newBb[0]),
                    Math.min(oldBb[1], newBb[1]),
                    Math.max(oldBb[2], newBb[2]),
                    Math.max(oldBb[3], newBb[3]),
                ];
            }
            return newBb;
        };
        return geoJsons.reduce(reducer, null);
    }

    function computeCenter(bb) {
        // compute geometries center
        return [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2];
    }

    function computeScale(bb) {
        // this is a very simple heuristic to compute a scale that fit map to screen
        // ideally we should try to understand how scale is taken into account in the
        // default projection
        const factor = Math.max(bb[2] - bb[0], bb[3] - bb[1]);
        return DEFAULT_SCALE / factor;
    }

    function tsoColor(status) {
        switch (status) {
            case IgmStatus.AVAILABLE:
                return '#009CD8';
            case IgmStatus.VALID:
                return '#02538B';
            case IgmStatus.INVALID:
                return '#D8404D';
            case IgmStatus.MERGED:
                return '#37AE4B';
            default:
                return '#78899a';
        }
    }

    useEffect(() => {
        if (props.tsos.length > 0) {
            Promise.all(
                props.tsos.map((tso) => {
                    const url = tso.toLowerCase() + '.json';
                    return fetch(url).then((resp) => resp.json());
                })
            ).then((jsons) => {
                // compute geometries bounding box
                const bb = computeBoundingBox(jsons);
                setData({
                    geographies: jsons,
                    center: computeCenter(bb),
                    scale: computeScale(bb),
                });
            });
        } else {
            setData({
                geographies: [],
                center: DEFAULT_CENTER,
                scale: DEFAULT_SCALE,
            });
        }
    }, [props.tsos]);

    const projectionConfig = { center: data.center, scale: data.scale };

    return (
        <div>
            <ComposableMap
                style={{
                    position: 'absolute',
                    top: '70px',
                    left: '-200px',
                    height: '100%',
                    width: '100%',
                    zIndex: '-1',
                }}
                projectionConfig={projectionConfig}
            >
                <ZoomableGroup minZoom={1} maxZoom={1}>
                    <Geographies geography={data.geographies}>
                        {({ geographies }) =>
                            geographies.map((geo, index) => {
                                const tso = props.tsos[index];
                                const status = getIgmStatus(tso, props.merge);
                                const color = tsoColor(status);
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        className={classes.tso}
                                        fill={color}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
            {props.children}
        </div>
    );
};

MergeMap.defaultProps = {
    igms: [],
};

MergeMap.propTypes = {
    tsos: PropTypes.arrayOf(PropTypes.string).isRequired,
    merge: MergeType,
};

export default React.memo(MergeMap);
