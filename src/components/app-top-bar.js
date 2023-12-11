/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { LIGHT_THEME, logout, TopBar } from '@gridsuite/commons-ui';
import Parameters, { useParameterState } from './parameters';
import { PARAM_LANGUAGE, PARAM_THEME } from '../utils/config-params';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchAppsAndUrls,
    fetchMergeConfigs,
    fetchVersion,
    getServersInfos,
} from '../utils/rest-api';
import PropTypes from 'prop-types';
import { useNavigate, useMatch } from 'react-router-dom';
import { ReactComponent as GridMergeLogoLight } from '../images/GridMerge_logo_light.svg';
import { ReactComponent as GridMergeLogoDark } from '../images/GridMerge_logo_dark.svg';
import { Tabs, Tab, Button } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import ProcessesConfigurationDialog from './processes-configuration-dialog';
import { makeStyles } from '@mui/styles';
import { initProcesses } from '../redux/actions';
import AppPackage from '../../package.json';

export const PREFIX_URL_PROCESSES = '/processes';

const useStyles = makeStyles(() => ({
    process: {
        marginLeft: 18,
    },
    btnConfigurationProcesses: {
        marginLeft: 'auto',
    },
}));

const AppTopBar = ({ user, userManager }) => {
    const navigate = useNavigate();

    const dispatch = useDispatch();

    const classes = useStyles();

    const [appsAndUrls, setAppsAndUrls] = useState([]);

    const theme = useSelector((state) => state[PARAM_THEME]);

    const configs = useSelector((state) => state.configs);

    const [themeLocal, handleChangeTheme] = useParameterState(PARAM_THEME);

    const [languageLocal, handleChangeLanguage] =
        useParameterState(PARAM_LANGUAGE);

    const [showParameters, setShowParameters] = useState(false);

    const [showConfigurationProcesses, setShowConfigurationProcesses] =
        useState(false);

    useEffect(() => {
        if (user !== null) {
            fetchMergeConfigs().then((configs) => {
                dispatch(initProcesses(configs));
            });

            fetchAppsAndUrls().then((res) => {
                setAppsAndUrls(res);
            });
        }
        // Note: dispatch doesn't change
    }, [dispatch, user]);

    const matchProcess = useMatch({
        path: PREFIX_URL_PROCESSES + '/:processName',
    });

    const selectedTabId = useMemo(() => {
        let index =
            matchProcess !== null
                ? configs.findIndex(
                      (c) => c.process === matchProcess.params.processName
                  )
                : -1;
        return index !== -1 ? matchProcess.params.processName : false;
    }, [configs, matchProcess]);

    return (
        <>
            <TopBar
                appName="Merge"
                appColor="#4795D1"
                appLogo={
                    theme === LIGHT_THEME ? (
                        <GridMergeLogoLight />
                    ) : (
                        <GridMergeLogoDark />
                    )
                }
                appVersion={AppPackage.version}
                appLicense={AppPackage.license}
                onParametersClick={() => setShowParameters(true)}
                onLogoutClick={() => logout(dispatch, userManager.instance)}
                onLogoClick={() => navigate('/', { replace: true })}
                user={user}
                appsAndUrls={appsAndUrls}
                onThemeClick={handleChangeTheme}
                theme={themeLocal}
                onLanguageClick={handleChangeLanguage}
                language={languageLocal}
                getGlobalVersion={(setGlobalVersion) =>
                    fetchVersion()
                        .then((res) => setGlobalVersion(res.deployVersion))
                        .catch((reason) => {
                          console.error(
                            'Error while fetching the version : ' + reason
                          );
                          setGlobalVersion(null);
                        })
                }
                getAdditionalComponents={(setServers) =>
                    getServersInfos()
                        .then((res) =>
                            setServers(
                                Object.entries(res).map(([name, infos]) => ({
                                    name:
                                        infos?.build?.name ||
                                        infos?.build?.artifact ||
                                        name,
                                    type: 'server',
                                    version: infos?.build?.version,
                                    gitTag:
                                        infos?.git?.tags ||
                                        infos?.git?.commit?.id[
                                            'describe-short'
                                        ],
                                }))
                            )
                        )
                        .catch((reason) => {
                          console.error(
                            'Error while fetching the servers infos : ' +
                            reason
                          );
                          setServers(null);
                        })
                }
            >
                <Tabs
                    value={selectedTabId}
                    indicatorColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                    onChange={(event, newValue) =>
                        navigate(PREFIX_URL_PROCESSES + '/' + newValue)
                    }
                    aria-label="parameters"
                    className={classes.process}
                >
                    {configs.map((config) => (
                        <Tab
                            key={config.processUuid}
                            label={config.process}
                            value={config.process}
                        />
                    ))}
                </Tabs>
                {user && (
                    <>
                        <Button
                            className={classes.btnConfigurationProcesses}
                            onClick={() => setShowConfigurationProcesses(true)}
                        >
                            <FormattedMessage id="configureProcesses" />
                        </Button>
                        <ProcessesConfigurationDialog
                            open={showConfigurationProcesses}
                            onClose={() => {
                                setShowConfigurationProcesses(false);
                            }}
                            matchProcess={matchProcess}
                        />
                    </>
                )}
            </TopBar>
            <Parameters
                showParameters={showParameters}
                hideParameters={() => setShowParameters(false)}
            />
        </>
    );
};

AppTopBar.propTypes = {
    user: PropTypes.object,
    userManager: PropTypes.object.isRequired,
};

export default AppTopBar;
