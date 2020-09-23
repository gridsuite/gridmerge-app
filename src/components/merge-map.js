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
import bbox from 'geojson-bbox';

const TSO_STROKE_COLOR = 'white';
const DEFAULT_CENTER = [0, 0];
const DEFAULT_SCALE = 30000;

const useStyles = makeStyles((theme) => ({
    map: {
        backgroundColor: theme.palette.background.paper,
    },
    tso: {
        stroke: TSO_STROKE_COLOR,
        strokeWidth: '1px',
        vectorEffect: 'non-scaling-stroke',
    },
}));

export const IgmStatus = {
    ABSENT: 'absent',
    AVAILABLE: 'available',
    VALID: 'valid',
    INVALID: 'invalid',
    MERGED: 'merged',
};

const MergeMap = (props) => {
    const [geographies, setGeographies] = useState([]);
    const [center, setCenter] = useState(DEFAULT_CENTER);
    const [scale, setScale] = useState(DEFAULT_SCALE);

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
        if (props.igms.length > 0) {
            Promise.all(
                props.igms.map((igm) => {
                    const url = igm.tso + '.json';
                    return fetch(url).then((resp) => resp.json());
                })
            ).then((jsons) => {
                // compute geometries bounding box
                const bb = computeBoundingBox(jsons);
                setCenter(computeCenter(bb));
                setScale(computeScale(bb));
                setGeographies(jsons);
            });
        } else {
            setCenter(DEFAULT_CENTER);
            setScale(DEFAULT_SCALE);
            setGeographies([]);
        }
    }, [props.igms]);

    const projectionConfig = { center: center, scale: scale };

    return (
        <div className={classes.map}>
            <ComposableMap
                style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    height: '100%',
                    width: '100%',
                    zIndex: '-1',
                }}
                projectionConfig={projectionConfig}
            >
                <ZoomableGroup minZoom={1} maxZoom={1}>
                    <Geographies geography={geographies}>
                        {({ geographies }) =>
                            geographies.map((geo, index) => {
                                const igm = props.igms[index];
                                const status = igm
                                    ? igm.status
                                    : IgmStatus.ABSENT;
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
    igms: PropTypes.arrayOf(
        PropTypes.shape({
            tso: PropTypes.string.isRequired,
            status: PropTypes.string.isRequired,
        })
    ),
};

export default MergeMap;
