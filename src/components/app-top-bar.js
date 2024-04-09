/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useMemo, useState } from 'react';
import { logout, TopBar } from '@gridsuite/commons-ui';
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
import { useMatch, useNavigate } from 'react-router-dom';
import { ReactComponent as GridMergeLogoLight } from '../images/GridMerge_logo_light.svg';
import { ReactComponent as GridMergeLogoDark } from '../images/GridMerge_logo_dark.svg';
import { Button, Tab, Tabs, useTheme } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import ProcessesConfigurationDialog from './processes-configuration-dialog';
import { initProcesses } from '../redux/actions';
import AppPackage from '../../package.json';

export const PREFIX_URL_PROCESSES = '/processes';

const styles = {
    process: {
        marginLeft: 18,
    },
    btnConfigurationProcesses: {
        marginLeft: 'auto',
    },
};

const AppTopBar = ({ user, userManager }) => {
    const navigate = useNavigate();

    const dispatch = useDispatch();

    const [appsAndUrls, setAppsAndUrls] = useState([]);

    const theme = useTheme();

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
                    theme.palette.mode === 'light' ? (
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
                globalVersionPromise={() =>
                    fetchVersion().then((res) => res?.deployVersion)
                }
                additionalModulesPromise={getServersInfos}
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
                    sx={styles.process}
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
                            sx={styles.btnConfigurationProcesses}
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
