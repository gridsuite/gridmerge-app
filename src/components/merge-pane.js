/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { useHistory, useLocation, useParams } from 'react-router-dom';

import { FormattedMessage } from 'react-intl';

import { parse, stringify } from 'qs';

import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

import NetworkExplorer from './network/network-explorer';
import NetworkMap from './network/network-map';
import SingleLineDiagram from './single-line-diagram';
import {
    fetchLinePositions,
    fetchLines,
    fetchSubstationPositions,
    fetchSubstations,
    getVoltageLevelSingleLineDiagram,
    updateSwitchState,
    connectNotificationsWebsocket,
    startLoadFlow,
} from '../utils/rest-api';
import {
    closeMerge,
    loadGeoDataSuccess,
    loadNetworkSuccess,
    openMerge,
    mergeUpdated,
} from '../redux/actions';
import Network from './network/network';
import GeoData from './network/geo-data';
import NominalVoltageFilter from './network/nominal-voltage-filter';
import Button from '@material-ui/core/Button';
import PlayIcon from '@material-ui/icons/PlayArrow';
import { green } from '@material-ui/core/colors';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import { CardHeader } from '@material-ui/core';
import PageNotFound from './page-not-found';

const useStyles = makeStyles((theme) => ({
    main: {
        position: 'absolute',
        width: '100%',
        height: 'calc(100vh - 56px)',
        [`${theme.breakpoints.up('xs')} and (orientation: landscape)`]: {
            height: 'calc(100vh - 48px)',
        },
        [theme.breakpoints.up('sm')]: {
            height: 'calc(100vh - 64px)',
        },
    },
    error: {
        padding: theme.spacing(2),
    },
}));

const INITIAL_POSITION = [0, 0];

const MergePane = () => {
    const mergeName = decodeURIComponent(useParams().mergeName);

    const network = useSelector((state) => state.network);

    const geoData = useSelector((state) => state.geoData);

    const useName = useSelector((state) => state.useName);

    const centerName = useSelector((state) => state.centerLabel);

    const diagonalName = useSelector((state) => state.diagonalLabel);

    const lineFullPath = useSelector((state) => state.lineFullPath);

    const lineParallelPath = useSelector((state) => state.lineParallelPath);

    const lineFlowMode = useSelector((state) => state.lineFlowMode);

    const mergeUpdatedForce = useSelector((state) => state.mergeUpdated);

    const [mergeNotFound, setMergeNotFound] = useState(false);

    const [displayedVoltageLevelId, setDisplayedVoltageLevelId] = useState(
        null
    );

    const [filteredNominalVoltages, setFilteredNominalVoltages] = useState([]);

    const [loadFlowRunning, setLoadFlowRunning] = useState(false);

    const [updateSwitchMsg, setUpdateSwitchMsg] = useState('');

    const dispatch = useDispatch();

    const classes = useStyles();

    const location = useLocation();

    const history = useHistory();

    const websocketExpectedCloseRef = useRef();

    // merge creation, network and geo data loading: will be called only one time at creation mount event because
    // mergeName won't change
    useEffect(() => {
        websocketExpectedCloseRef.current = false;
        dispatch(openMerge(mergeName));

        loadNetwork(mergeName);
        loadGeoData(mergeName);
        const ws = connectNotifications(mergeName);

        // merge cleanup at unmount event
        return function () {
            websocketExpectedCloseRef.current = true;
            ws.close();
            dispatch(closeMerge());
        };
    }, [mergeName]);

    // set single line diagram voltage level id, contained in url query parameters
    useEffect(() => {
        // parse query parameter
        const queryParams = parse(location.search, { ignoreQueryPrefix: true });
        const newVoltageLevelId = queryParams['voltageLevelId'];
        setDisplayedVoltageLevelId(
            newVoltageLevelId ? newVoltageLevelId : null
        );
    }, [location.search]);

    useEffect(() => {
        if (network) {
            setFilteredNominalVoltages(network.getNominalVoltages());
        } else {
            setFilteredNominalVoltages([]);
        }
    }, [network]);

    function loadNetwork(mergeName) {
        console.info(`Loading network of merge '${mergeName}'...`);

        const substations = fetchSubstations(mergeName);

        const lines = fetchLines(mergeName);

        Promise.all([substations, lines])
            .then((values) => {
                const network = new Network();
                network.setSubstations(values[0]);
                network.setLines(values[1]);
                dispatch(loadNetworkSuccess(network));
            })
            .catch(function (error) {
                console.error(error.message);
                setMergeNotFound(true);
            });
    }

    function loadGeoData(mergeName) {
        console.info(`Loading geo data of merge '${mergeName}'...`);

        const substationPositions = fetchSubstationPositions(mergeName);

        const linePositions = fetchLinePositions(mergeName);

        Promise.all([substationPositions, linePositions])
            .then((values) => {
                const geoData = new GeoData();
                geoData.setSubstationPositions(values[0]);
                geoData.setLinePositions(values[1]);
                dispatch(loadGeoDataSuccess(geoData));
            })
            .catch(function (error) {
                console.error(error.message);
                setMergeNotFound(true);
            });
    }

    function connectNotifications(mergeName) {
        console.info(`Connecting to notifications '${mergeName}'...`);

        const ws = connectNotificationsWebsocket(mergeName);
        ws.onmessage = function (event) {
            dispatch(mergeUpdated(JSON.parse(event.data)));
        };
        ws.onclose = function (event) {
            if (!websocketExpectedCloseRef.current) {
                console.error('Unexpected Notification WebSocket closed');
            }
        };
        ws.onerror = function (event) {
            console.error('Unexpected Notification WebSocket error', event);
        };
        return ws;
    }

    const showVoltageLevelDiagram = useCallback((voltageLevelId) => {
        setUpdateSwitchMsg('');
        history.replace(
            '/studies/' +
                encodeURIComponent(mergeName) +
                stringify(
                    { voltageLevelId: voltageLevelId },
                    { addQueryPrefix: true }
                )
        );
    }, []);

    function closeVoltageLevelDiagram() {
        history.replace('/studies/' + encodeURIComponent(mergeName));
    }

    const sldRef = useRef();
    const handleUpdateSwitchState = useCallback(
        (breakerId, open, switchElement) => {
            let eltOpen = switchElement.querySelector('.open');
            let eltClose = switchElement.querySelector('.closed');

            eltOpen.style.visibility = open ? 'visible' : 'hidden';
            eltClose.style.visibility = open ? 'hidden' : 'visible';

            updateSwitchState(mergeName, breakerId, open).then((response) => {
                if (!response.ok) {
                    console.error(response);
                    eltOpen.style.visibility = open ? 'hidden' : 'visible';
                    eltClose.style.visibility = open ? 'visible' : 'hidden';
                    setUpdateSwitchMsg(
                        response.status + ' : ' + response.statusText
                    );
                }
            });
        },
        [mergeName]
    );

    useEffect(() => {
        if (mergeUpdatedForce.eventData.headers) {
            if (sldRef.current) {
                setUpdateSwitchMsg('');
                sldRef.current.reloadSvg();
            }
            if (
                mergeUpdatedForce.eventData.headers['updateType'] == 'loadflow'
            ) {
                //TODO reload data more intelligently
                loadNetwork(mergeName);
            }
        }
    }, [mergeUpdatedForce]);

    const updateFilteredNominalVoltages = (vnoms, isToggle) => {
        // filter on nominal voltage
        let newFiltered;
        if (isToggle) {
            newFiltered = [...filteredNominalVoltages];
            vnoms.map((vnom) => {
                const currentIndex = filteredNominalVoltages.indexOf(vnom);
                if (currentIndex === -1) {
                    newFiltered.push(vnom);
                } else {
                    newFiltered.splice(currentIndex, 1);
                }
            });
        } else {
            newFiltered = [...vnoms];
        }
        setFilteredNominalVoltages(newFiltered);
    };

    const loadFlowButtonStyles = makeStyles({
        root: {
            backgroundColor: green[500],
            '&:hover': {
                backgroundColor: green[700],
            },
        },
        label: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },
    });

    function RunLoadFlowButton() {
        const loadFlowButtonClasses = loadFlowButtonStyles();

        useEffect(() => {
            if (loadFlowRunning) {
                startLoadFlow(mergeName)
                    .then(() => {})
                    .then(() => {
                        setLoadFlowRunning(false);
                    });
            }
        }, [loadFlowRunning]);

        const handleClick = () => setLoadFlowRunning(true);

        return (
            <Button
                variant="contained"
                fullWidth={true}
                className={loadFlowButtonClasses.root}
                startIcon={<PlayIcon />}
                disabled={loadFlowRunning}
                onClick={!loadFlowRunning ? handleClick : null}
            >
                <div className={loadFlowButtonClasses.label}>
                    <Typography noWrap>
                        {loadFlowRunning
                            ? 'LoadFlow running…'
                            : 'Start LoadFlow'}
                    </Typography>
                </div>
            </Button>
        );
    }

    const mapRef = useRef();
    const centerSubstation = useCallback(
        (id) => {
            mapRef.current.centerSubstation(
                network.getVoltageLevel(id).substationId
            );
        },
        [mapRef, network]
    );

    if (mergeNotFound) {
        return (
            <PageNotFound
                message={
                    <FormattedMessage
                        id="mergeNotFound"
                        values={{ mergeName: mergeName }}
                    />
                }
            />
        );
    } else {
        let displayedVoltageLevel,
            focusedVoltageLevel = null;
        if (network) {
            if (displayedVoltageLevelId) {
                displayedVoltageLevel = network.getVoltageLevel(
                    displayedVoltageLevelId
                );
            }
        }
        return (
            <Grid container direction="row" className={classes.main}>
                <Grid item xs={12} md={2}>
                    <AutoSizer>
                        {({ width, height }) => (
                            <div style={{ width: width, height: height }}>
                                <Grid container direction="column">
                                    <Grid item key="loadFlowButton">
                                        <div
                                            style={{
                                                position: 'relative',
                                                marginLeft: 8,
                                                marginRight: 8,
                                                marginTop: 8,
                                            }}
                                        >
                                            <RunLoadFlowButton />
                                        </div>
                                    </Grid>
                                    <Grid item key="explorer">
                                        <div
                                            style={{
                                                position: 'relative',
                                                height: height - 44,
                                            }}
                                        >
                                            <NetworkExplorer
                                                network={network}
                                                onVoltageLevelDisplayClick={
                                                    showVoltageLevelDiagram
                                                }
                                                onVoltageLevelFocusClick={
                                                    centerSubstation
                                                }
                                            />
                                        </div>
                                    </Grid>
                                </Grid>
                            </div>
                        )}
                    </AutoSizer>
                </Grid>
                <Grid item xs={12} md={10} key="map">
                    <div
                        style={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        <NetworkMap
                            network={network}
                            geoData={geoData}
                            labelsZoomThreshold={9}
                            arrowsZoomThreshold={7}
                            initialPosition={INITIAL_POSITION}
                            initialZoom={1}
                            filteredNominalVoltages={filteredNominalVoltages}
                            lineFullPath={lineFullPath}
                            lineParallelPath={lineParallelPath}
                            lineFlowMode={lineFlowMode}
                            ref={mapRef}
                            onSubstationClick={showVoltageLevelDiagram}
                        />
                        {displayedVoltageLevelId && (
                            <div
                                style={{
                                    position: 'absolute',
                                    left: 10,
                                    top: 10,
                                    zIndex: 1,
                                }}
                            >
                                <SingleLineDiagram
                                    onClose={() => closeVoltageLevelDiagram()}
                                    onNextVoltageLevelClick={
                                        showVoltageLevelDiagram
                                    }
                                    onBreakerClick={handleUpdateSwitchState}
                                    diagramTitle={
                                        useName && displayedVoltageLevel
                                            ? displayedVoltageLevel.name
                                            : displayedVoltageLevelId
                                    }
                                    svgUrl={getVoltageLevelSingleLineDiagram(
                                        mergeName,
                                        displayedVoltageLevelId,
                                        useName,
                                        centerName,
                                        diagonalName
                                    )}
                                    ref={sldRef}
                                    updateSwitchMsg={updateSwitchMsg}
                                />
                            </div>
                        )}
                        {network && (
                            <div
                                style={{
                                    position: 'absolute',
                                    right: 10,
                                    bottom: 30,
                                    zIndex: 1,
                                }}
                            >
                                <NominalVoltageFilter
                                    nominalVoltages={network.getNominalVoltages()}
                                    filteredNominalVoltages={
                                        filteredNominalVoltages
                                    }
                                    onNominalVoltageFilterChange={
                                        updateFilteredNominalVoltages
                                    }
                                />
                            </div>
                        )}
                    </div>
                </Grid>
            </Grid>
        );
    }
};

export default MergePane;
