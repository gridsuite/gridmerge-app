/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import {
    Redirect,
    Route,
    Switch,
    useHistory,
    useLocation,
    useRouteMatch,
} from 'react-router-dom';

import {
    createMuiTheme,
    makeStyles,
    ThemeProvider,
} from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { initProcesses, LIGHT_THEME } from '../redux/actions';

import {
    AuthenticationRouter,
    getPreLoginPath,
    initializeAuthenticationProd,
    logout,
    TopBar,
} from '@gridsuite/commons-ui';
import { FormattedMessage } from 'react-intl';

import Process from './process';

import Parameters from './parameters';
import ConfigurationWorkflows from './configuration-workflows';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Button from '@material-ui/core/Button';
import { fetchAppsAndUrls, fetchMergeConfigs } from '../utils/api';

import { ReactComponent as GridMergeLogoDark } from '../images/GridMerge_logo_dark.svg';
import { ReactComponent as GridMergeLogoLight } from '../images/GridMerge_logo_light.svg';

const PREFIX_URL_PROCESSES = '/processes';

const lightTheme = createMuiTheme({
    palette: {
        type: 'light',
    },
    mapboxStyle: 'mapbox://styles/mapbox/light-v9',
});

const darkTheme = createMuiTheme({
    palette: {
        type: 'dark',
    },
    mapboxStyle: 'mapbox://styles/mapbox/dark-v9',
});

const getMuiTheme = (theme) => {
    if (theme === LIGHT_THEME) {
        return lightTheme;
    } else {
        return darkTheme;
    }
};

const useStyles = makeStyles(() => ({
    process: {
        marginLeft: 18,
    },
    btnConfigurationWorkflows: {
        position: 'absolute',
        right: '185px',
    },
}));

const noUserManager = { instance: null, error: null };

const App = () => {
    const configs = useSelector((state) => state.configs);

    const theme = useSelector((state) => state.theme);

    const user = useSelector((state) => state.user);

    const signInCallbackError = useSelector(
        (state) => state.signInCallbackError
    );

    const [userManager, setUserManager] = useState(noUserManager);

    const [showParameters, setShowParameters] = useState(false);

    const [
        showConfigurationWorkflows,
        setShowConfigurationWorkflows,
    ] = useState(false);

    const history = useHistory();

    const dispatch = useDispatch();

    const location = useLocation();

    const classes = useStyles();

    const [appsAndUrls, setAppsAndUrls] = React.useState([]);

    const [selectedTabId, setSelectedTabId] = React.useState(false);

    const matchProcess = useRouteMatch({
        path: PREFIX_URL_PROCESSES + '/:processName',
        exact: true,
        sensitive: false,
    });

    // Can't use lazy initializer because useRouteMatch is a hook
    const [initialMatchSilentRenewCallbackUrl] = useState(
        useRouteMatch({
            path: '/silent-renew-callback',
            exact: true,
        })
    );

    useEffect(() => {
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    });

    useEffect(() => {
        initializeAuthenticationProd(
            dispatch,
            initialMatchSilentRenewCallbackUrl != null,
            fetch('idpSettings.json')
        )
            .then((userManager) => {
                setUserManager({ instance: userManager, error: null });
                userManager.getUser().then((user) => {
                    if (
                        user == null &&
                        initialMatchSilentRenewCallbackUrl == null
                    ) {
                        userManager.signinSilent().catch((error) => {
                            const oidcHackReloaded =
                                'gridsuite-oidc-hack-reloaded';
                            if (
                                !sessionStorage.getItem(oidcHackReloaded) &&
                                error.message ===
                                    'authority mismatch on settings vs. signin state'
                            ) {
                                sessionStorage.setItem(oidcHackReloaded, true);
                                console.log(
                                    'Hack oidc, reload page to make login work'
                                );
                                window.location.reload();
                            }
                        });
                    }
                });
            })
            .catch(function (error) {
                setUserManager({ instance: null, error: error.message });
                console.debug('error when importing the idp settings');
            });
        // Note: initialMatchSilentRenewCallbackUrl and dispatch don't change
    }, [initialMatchSilentRenewCallbackUrl, dispatch]);

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

    useEffect(() => {
        let index =
            matchProcess !== null
                ? configs.findIndex(
                      (c) => c.process === matchProcess.params.processName
                  )
                : -1;
        index !== -1
            ? setSelectedTabId(matchProcess.params.processName)
            : setSelectedTabId(false);
    }, [configs, matchProcess]);

    function onLogoClicked() {
        history.replace('/');
    }

    function showParametersClicked() {
        setShowParameters(true);
    }

    function hideParameters() {
        setShowParameters(false);
    }

    function toggleTab(newTabValue) {
        history.push(PREFIX_URL_PROCESSES + '/' + newTabValue);
    }

    function getProcessIndex(processName) {
        return configs.findIndex((c) => c.process === processName);
    }

    function displayProcess(processName) {
        let index = getProcessIndex(processName);
        return index !== -1 ? (
            <Process index={index} />
        ) : (
            <h1>
                <FormattedMessage id="pageNotFound" />{' '}
            </h1>
        );
    }

    const showPopupConfigurationWorkflows = () => {
        setShowConfigurationWorkflows(true);
    };

    return (
        <ThemeProvider theme={getMuiTheme(theme)}>
            <React.Fragment>
                <CssBaseline />
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
                                key={config.process}
                                label={config.process}
                                value={config.process}
                            />
                        ))}
                    </Tabs>
                    {user && (
                        <div className={classes.btnConfigurationWorkflows}>
                            <Button onClick={showPopupConfigurationWorkflows}>
                                <FormattedMessage id="configurationWorkflowsLink" />
                            </Button>
                            <ConfigurationWorkflows
                                open={showConfigurationWorkflows}
                                onClose={() =>
                                    setShowConfigurationWorkflows(false)
                                }
                            />
                        </div>
                    )}
                </TopBar>
                <Parameters
                    showParameters={showParameters}
                    hideParameters={hideParameters}
                />
                {user !== null ? (
                    <>
                        <Switch>
                            <Route exact path={'/'}>
                                {configs.length > 0 && (
                                    <Redirect
                                        to={
                                            PREFIX_URL_PROCESSES +
                                            '/' +
                                            configs[0].process
                                        }
                                    />
                                )}
                            </Route>
                            <Route exact path="/sign-in-callback">
                                <Redirect to={getPreLoginPath() || '/'} />
                            </Route>
                            <Route exact path="/logout-callback">
                                <h1>
                                    Error: logout failed; you are still logged
                                    in.
                                </h1>
                            </Route>
                            <Route
                                exact
                                path={PREFIX_URL_PROCESSES + '/:processName'}
                                render={({ match }) =>
                                    displayProcess(match.params.processName)
                                }
                            />
                            <Route>
                                <h1>
                                    <FormattedMessage id="pageNotFound" />{' '}
                                </h1>
                            </Route>
                        </Switch>
                    </>
                ) : (
                    <AuthenticationRouter
                        userManager={userManager}
                        signInCallbackError={signInCallbackError}
                        dispatch={dispatch}
                        history={history}
                        location={location}
                    />
                )}
            </React.Fragment>
        </ThemeProvider>
    );
};

export default App;
