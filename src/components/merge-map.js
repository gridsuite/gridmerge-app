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
import { IgmStatus, getIgmStatus, MergeType } from '../utils/rest-api';
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

    function tsoColor(status) {
        switch (status.status) {
            case IgmStatus.AVAILABLE:
                return status.replacingDate == null ? '#009CD8' : '#F8E67E';
            case IgmStatus.VALID:
                return status.replacingDate == null ? '#02538B' : '#F3D111';
            case IgmStatus.INVALID:
                return status.replacingDate == null ? '#D8404D' : '#D86640';
            case IgmStatus.MERGED:
                return status.replacingDate == null ? '#37AE4B' : '#90EE90';
            default:
                return '#78899a';
        }
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
