/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

import { makeStyles } from '@material-ui/core/styles';
import bbox from 'geojson-bbox';
import {
    IgmStatus,
    getIgmStatus,
    MergeType,
    CgmStatus,
} from '../utils/rest-api';
import ReactTooltip from 'react-tooltip';
import { getDetailsByCountryOrTso } from '../utils/tso-country-details';

const TSO_STROKE_COLOR = 'white';
const DEFAULT_CENTER = [0, 0];
const DEFAULT_SCALE = 35000;

const useStyles = makeStyles((theme) => ({
    tso: {
        stroke: TSO_STROKE_COLOR,
        strokeWidth: '1px',
        vectorEffect: 'non-scaling-stroke',
    },
}));

const LIGHT_BLUE_COLOR = '#009CD8';
const LIGHT_YELLOW_COLOR = '#F8E67E';
const DARK_BLUE_COLOR = '#02538B';
const DARK_YELLOW_COLOR = '#F3D111';
const LIGHT_RED_COLOR = '#FF6666';
const DARK_RED_COLOR = '#FF3333';
const GREEN_COLOR = '#00CC00';
const LIGHT_GREEN_COLOR = '#00FF33';
const ORANGE_COLOR = '#FF6600';
const LIGHT_ORANGE_COLOR = '#FF9900';
const RED_COLOR = '#FF0000';
const GREY_COLOR = '#78899a';

export function tsoColor(status) {
    switch (status.status) {
        case IgmStatus.AVAILABLE:
            return status.replacingDate == null
                ? LIGHT_BLUE_COLOR
                : LIGHT_YELLOW_COLOR;
        case IgmStatus.VALID:
            return status.replacingDate == null
                ? DARK_BLUE_COLOR
                : DARK_YELLOW_COLOR;
        case IgmStatus.INVALID:
            return status.replacingDate == null
                ? LIGHT_RED_COLOR
                : DARK_RED_COLOR;
        case IgmStatus.MERGED: {
            switch (status.cgmStatus) {
                case CgmStatus.VALID:
                    return status.replacingDate == null
                        ? GREEN_COLOR
                        : LIGHT_GREEN_COLOR;
                case CgmStatus.VALID_WITH_WARNING:
                    return status.replacingDate == null
                        ? ORANGE_COLOR
                        : LIGHT_ORANGE_COLOR;
                case CgmStatus.INVALID:
                    return status.replacingDate == null
                        ? RED_COLOR
                        : LIGHT_RED_COLOR;
                default:
                    return GREY_COLOR;
            }
        }
        default:
            return GREY_COLOR;
    }
}

const MergeMap = (props) => {
    const [data, setData] = useState({
        geographies: [],
        center: DEFAULT_CENTER,
        scale: DEFAULT_SCALE,
    });

    const [tooltip, setTooltip] = useState('');

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

    useEffect(() => {
        setData({
            geographies: [],
            center: DEFAULT_CENTER,
            scale: DEFAULT_SCALE,
        });
        if (props.tsos.length > 0) {
            Promise.all(
                props.tsos.map((tso) => {
                    const { countryCode } = getDetailsByCountryOrTso(tso);
                    const url = countryCode.toLowerCase() + '.json';
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
        }
    }, [props.tsos]);

    const projectionConfig = { center: data.center, scale: data.scale };

    return (
        <div>
            <ComposableMap
                data-tip=""
                style={{
                    height: 'calc(100vh - 240px)',
                    width: '100%',
                    zIndex: '-1',
                }}
                projectionConfig={projectionConfig}
            >
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
                                    onMouseEnter={() => {
                                        if (
                                            status.replacingDate &&
                                            status.replacingBusinessProcess
                                        ) {
                                            let dt = new Date(
                                                status.replacingDate
                                            );
                                            setTooltip(
                                                '' +
                                                    tso +
                                                    ' - ' +
                                                    dt.toLocaleString() +
                                                    ' - ' +
                                                    status.replacingBusinessProcess
                                            );
                                        } else if (
                                            props.merge &&
                                            status.status !== IgmStatus.ABSENT
                                        ) {
                                            let dt = new Date(props.merge.date);
                                            setTooltip(
                                                '' +
                                                    tso +
                                                    ' - ' +
                                                    dt.toLocaleString() +
                                                    ' - ' +
                                                    props.config.businessProcess
                                            );
                                        } else {
                                            setTooltip('');
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        setTooltip('');
                                    }}
                                />
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>
            <ReactTooltip>{tooltip}</ReactTooltip>
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
    config: PropTypes.object,
};

export default React.memo(MergeMap);
