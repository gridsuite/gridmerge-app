/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import {
    Redirect,
    Route,
    Switch,
    useHistory,
    useLocation,
    useRouteMatch,
} from 'react-router-dom';

import { makeStyles } from '@material-ui/core/styles';
import {
    initProcesses,
    LIGHT_THEME,
    selectTheme,
    selectTimelineDiagonalLabels,
    selectLanguage,
    selectComputedLanguage,
} from '../redux/actions';

import {
    AuthenticationRouter,
    getPreLoginPath,
    initializeAuthenticationProd,
    logout,
    TopBar,
} from '@gridsuite/commons-ui';
import { FormattedMessage } from 'react-intl';

import Process from './process';

import Parameters, { useParameterState } from './parameters';
import ProcessesConfigurationDialog from './processes-configuration-dialog';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Button from '@material-ui/core/Button';
import {
    connectNotificationsWsUpdateConfig,
    fetchAppsAndUrls,
    fetchConfigParameter,
    fetchConfigParameters,
    fetchMergeConfigs,
} from '../utils/rest-api';

import { ReactComponent as GridMergeLogoDark } from '../images/GridMerge_logo_dark.svg';
import { ReactComponent as GridMergeLogoLight } from '../images/GridMerge_logo_light.svg';
import {
    APP_NAME,
    COMMON_APP_NAME,
    PARAM_THEME,
    PARAM_LANGUAGE,
    PARAM_TIMELINE_DIAGONAL_LABELS,
} from '../utils/config-params';
import { getComputedLanguage } from '../utils/language';
import { useSnackbar } from 'notistack';
import { displayErrorMessageWithSnackbar, useIntlRef } from '../utils/messages';

const PREFIX_URL_PROCESSES = '/processes';

const useStyles = makeStyles(() => ({
    process: {
        marginLeft: 18,
    },
    btnConfigurationProcesses: {
        marginLeft: 'auto',
    },
}));

const noUserManager = { instance: null, error: null };

const App = () => {
    const intlRef = useIntlRef();

    const { enqueueSnackbar } = useSnackbar();

    const configs = useSelector((state) => state.configs);

    const user = useSelector((state) => state.user);

    const theme = useSelector((state) => state[PARAM_THEME]);

    const [themeLocal, handleChangeTheme] = useParameterState(PARAM_THEME);

    const [languageLocal, handleChangeLanguage] = useParameterState(
        PARAM_LANGUAGE
    );

    const signInCallbackError = useSelector(
        (state) => state.signInCallbackError
    );

    const [userManager, setUserManager] = useState(noUserManager);

    const [showParameters, setShowParameters] = useState(false);

    const [
        showConfigurationProcesses,
        setShowConfigurationProcesses,
    ] = useState(false);

    const history = useHistory();

    const dispatch = useDispatch();

    const location = useLocation();

    const classes = useStyles();

    const [appsAndUrls, setAppsAndUrls] = useState([]);

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

    const updateParams = useCallback(
        (params) => {
            console.debug('received UI parameters : ', params);
            params.forEach((param) => {
                switch (param.name) {
                    case PARAM_THEME:
                        dispatch(selectTheme(param.value));
                        break;
                    case PARAM_TIMELINE_DIAGONAL_LABELS:
                        dispatch(
                            selectTimelineDiagonalLabels(param.value === 'true')
                        );
                        break;
                    case PARAM_LANGUAGE:
                        dispatch(selectLanguage(param.value));
                        dispatch(
                            selectComputedLanguage(
                                getComputedLanguage(param.value)
                            )
                        );
                        break;
                    default:
                }
            });
        },
        [dispatch]
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

    const connectNotificationsUpdateConfig = useCallback(() => {
        const ws = connectNotificationsWsUpdateConfig();

        ws.onmessage = function (event) {
            let eventData = JSON.parse(event.data);
            if (eventData.headers && eventData.headers['parameterName']) {
                fetchConfigParameter(eventData.headers['parameterName'])
                    .then((param) => updateParams([param]))
                    .catch((errorMessage) =>
                        displayErrorMessageWithSnackbar({
                            errorMessage: errorMessage,
                            enqueueSnackbar: enqueueSnackbar,
                            headerMessage: {
                                headerMessageId: 'paramsRetrievingError',
                                intlRef: intlRef,
                            },
                        })
                    );
            }
        };
        ws.onerror = function (event) {
            console.error('Unexpected Notification WebSocket error', event);
        };
        return ws;
    }, [updateParams, enqueueSnackbar, intlRef]);

    useEffect(() => {
        if (user !== null) {
            fetchConfigParameters(COMMON_APP_NAME)
                .then((params) => updateParams(params))
                .catch((errorMessage) =>
                    displayErrorMessageWithSnackbar({
                        errorMessage: errorMessage,
                        enqueueSnackbar: enqueueSnackbar,
                        headerMessage: {
                            headerMessageId: 'paramsRetrievingError',
                            intlRef: intlRef,
                        },
                    })
                );

            fetchConfigParameters(APP_NAME)
                .then((params) => updateParams(params))
                .catch((errorMessage) =>
                    displayErrorMessageWithSnackbar({
                        errorMessage: errorMessage,
                        enqueueSnackbar: enqueueSnackbar,
                        headerMessage: {
                            headerMessageId: 'paramsRetrievingError',
                            intlRef: intlRef,
                        },
                    })
                );

            const ws = connectNotificationsUpdateConfig();
            return function () {
                ws.close();
            };
        }
    }, [
        user,
        dispatch,
        updateParams,
        connectNotificationsUpdateConfig,
        enqueueSnackbar,
        intlRef,
    ]);

    const selectedTabId = useMemo(() => {
        let index =
            matchProcess !== null
                ? configs.findIndex(
                      (c) => c.process === matchProcess.params.processName
                  )
                : -1;
        return index !== -1 ? matchProcess.params.processName : false;
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
                                Error: logout failed; you are still logged in.
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
        </>
    );
};

export default App;
