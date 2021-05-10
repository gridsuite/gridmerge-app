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
import { fetchAppsAndUrls, fetchMergeConfigs } from '../utils/rest-api';
import PropTypes from 'prop-types';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { ReactComponent as GridMergeLogoLight } from '../images/GridMerge_logo_light.svg';
import { ReactComponent as GridMergeLogoDark } from '../images/GridMerge_logo_dark.svg';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Button from '@material-ui/core/Button';
import { FormattedMessage } from 'react-intl';
import ProcessesConfigurationDialog from './processes-configuration-dialog';
import { makeStyles } from '@material-ui/core/styles';
import { initProcesses } from '../redux/actions';

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
    const history = useHistory();

    const dispatch = useDispatch();

    const classes = useStyles();

    const [appsAndUrls, setAppsAndUrls] = useState([]);

    const theme = useSelector((state) => state[PARAM_THEME]);

    const configs = useSelector((state) => state.configs);

    const [themeLocal, handleChangeTheme] = useParameterState(PARAM_THEME);

    const [languageLocal, handleChangeLanguage] = useParameterState(
        PARAM_LANGUAGE
    );

    const [showParameters, setShowParameters] = useState(false);

    const [
        showConfigurationProcesses,
        setShowConfigurationProcesses,
    ] = useState(false);

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

    const matchProcess = useRouteMatch({
        path: PREFIX_URL_PROCESSES + '/:processName',
        exact: true,
        sensitive: false,
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

    function toggleTab(newTabValue) {
        history.push(PREFIX_URL_PROCESSES + '/' + newTabValue);
    }

    function showParametersClicked() {
        setShowParameters(true);
    }

    function hideParameters() {
        setShowParameters(false);
    }

    function onLogoClicked() {
        history.replace('/');
    }

    const showPopupConfigurationProcesses = () => {
        setShowConfigurationProcesses(true);
    };

    return (
        <>
            <TopBar
                appName="Merge"
                appColor="#2D9BF0"
                appLogo={
                    theme === LIGHT_THEME ? (
                        <GridMergeLogoLight />
                    ) : (
                        <GridMergeLogoDark />
                    )
                }
                onParametersClick={() => showParametersClicked()}
                onLogoutClick={() => logout(dispatch, userManager.instance)}
                onLogoClick={() => onLogoClicked()}
                user={user}
                appsAndUrls={appsAndUrls}
                onThemeClick={handleChangeTheme}
                theme={themeLocal}
                onAboutClick={() => console.debug('about')}
                onLanguageClick={handleChangeLanguage}
                language={languageLocal}
            >
                <Tabs
                    value={selectedTabId}
                    indicatorColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                    onChange={(event, newValue) => toggleTab(newValue)}
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
                            onClick={showPopupConfigurationProcesses}
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
                hideParameters={hideParameters}
            />
        </>
    );
};

AppTopBar.propTypes = {
    user: PropTypes.object,
    userManager: PropTypes.object.isRequired,
};

export default AppTopBar;
